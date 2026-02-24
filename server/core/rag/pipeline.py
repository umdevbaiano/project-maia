"""
Maia Platform — RAG Pipeline
Full implementation: text extraction, chunking, embedding, ChromaDB storage & retrieval.
Supports hybrid retrieval: legal base (global) + workspace documents.
"""
import io
from typing import Optional

import chromadb
import fitz  # PyMuPDF

from config import get_settings
from core.rag.embeddings import embed_texts, embed_query, get_chroma_embedding_function


# Global ChromaDB client (lazy-loaded)
_chroma_client: Optional[chromadb.HttpClient] = None


def _get_chroma() -> chromadb.HttpClient:
    global _chroma_client
    if _chroma_client is None:
        settings = get_settings()
        _chroma_client = chromadb.HttpClient(host=settings.CHROMA_URL.replace("http://", "").split(":")[0],
                                             port=int(settings.CHROMA_URL.split(":")[-1]))
    return _chroma_client


# ---------- Text Extraction ----------

def extract_text(file_bytes: bytes, file_type: str) -> str:
    if file_type == "pdf":
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    elif file_type == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    elif file_type == "docx":
        doc = fitz.open(stream=file_bytes, filetype="docx")
        return "\n".join(page.get_text() for page in doc)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


# ---------- Chunking ----------

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    if not text.strip():
        return []
    chunks = []
    sentences = text.replace("\n", " ").split(". ")
    current_chunk = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        candidate = f"{current_chunk}. {sentence}" if current_chunk else sentence
        if len(candidate) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
            current_chunk = f"{overlap_text} {sentence}"
        else:
            current_chunk = candidate

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def chunk_by_article(text: str) -> list[dict]:
    """
    Chunk legal text by article for precise legal retrieval.
    Returns list of {"text": ..., "article": ...}
    """
    import re
    # Match patterns like "Art. 1º", "Art. 1.", "Art. 100", etc.
    pattern = r'(Art\.\s*\d+[º°]?[\-A-Z]*\.?\s*)'
    parts = re.split(pattern, text)

    chunks = []
    current_article = ""
    current_text = ""

    for part in parts:
        if re.match(pattern, part):
            if current_text.strip():
                chunks.append({
                    "text": f"{current_article} {current_text}".strip(),
                    "article": current_article.strip()
                })
            current_article = part.strip()
            current_text = ""
        else:
            current_text += part

    if current_text.strip():
        chunks.append({
            "text": f"{current_article} {current_text}".strip(),
            "article": current_article.strip()
        })

    # If no articles found, fall back to regular chunking
    if not chunks:
        return [{"text": c, "article": ""} for c in chunk_text(text)]

    return chunks


# ---------- Workspace Document Storage ----------

def _get_workspace_collection(workspace_id: str):
    client = _get_chroma()
    ef = get_chroma_embedding_function()
    return client.get_or_create_collection(
        name=f"workspace_{workspace_id}",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )


async def index_document(workspace_id: str, doc_id: str, filename: str, chunks: list[str]) -> int:
    if not chunks:
        return 0
    collection = _get_workspace_collection(workspace_id)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    return len(chunks)


async def delete_document(workspace_id: str, doc_id: str) -> None:
    try:
        collection = _get_workspace_collection(workspace_id)
        existing = collection.get(where={"doc_id": doc_id})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception as e:
        print(f"Error deleting document from ChromaDB: {e}")


# ---------- Legal Base Storage ----------

def _get_legal_collection():
    client = _get_chroma()
    ef = get_chroma_embedding_function()
    return client.get_or_create_collection(
        name="legislacao_br",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )


def index_legal_chunks(law_name: str, law_id: str, chunks: list[dict]) -> int:
    """
    Index legal article chunks into the global 'legislacao_br' collection.
    chunks: [{"text": ..., "article": ...}, ...]
    """
    if not chunks:
        return 0
    collection = _get_legal_collection()
    ids = [f"{law_id}_art_{i}" for i in range(len(chunks))]
    documents = [c["text"] for c in chunks]
    metadatas = [{"law_name": law_name, "law_id": law_id, "article": c.get("article", ""), "chunk_index": i}
                 for i, c in enumerate(chunks)]
    # Upsert to allow re-indexing
    collection.upsert(documents=documents, ids=ids, metadatas=metadatas)
    return len(chunks)


def get_legal_collection_count() -> int:
    try:
        collection = _get_legal_collection()
        return collection.count()
    except Exception:
        return 0


# ---------- Retrieval ----------

async def retrieve(workspace_id: str, query: str, top_k: int = 3) -> list[str]:
    """Retrieve from workspace documents only."""
    try:
        collection = _get_workspace_collection(workspace_id)
        results = collection.query(query_texts=[query], n_results=top_k)
        return results["documents"][0] if results["documents"] else []
    except Exception as e:
        print(f"RAG retrieval error: {e}")
        return []


async def retrieve_legal(query: str, top_k: int = 5) -> list[str]:
    """Retrieve from global legal base."""
    try:
        collection = _get_legal_collection()
        if collection.count() == 0:
            return []
        results = collection.query(query_texts=[query], n_results=top_k)
        return results["documents"][0] if results["documents"] else []
    except Exception as e:
        print(f"Legal retrieval error: {e}")
        return []


async def retrieve_hybrid(workspace_id: str, query: str) -> dict:
    """
    Hybrid retrieval: legal base (top-5) + workspace docs (top-3).
    Returns {"legal": [...], "workspace": [...]}
    """
    legal = await retrieve_legal(query, top_k=5)
    workspace = await retrieve(workspace_id, query, top_k=3)
    return {"legal": legal, "workspace": workspace}
