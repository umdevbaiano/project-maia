"""
Maia Platform — RAG Pipeline
Full implementation: text extraction, chunking, embedding, ChromaDB storage & retrieval.
Supports hybrid retrieval: legal base (global) + workspace documents.
"""
from typing import Optional

import chromadb
import fitz  # PyMuPDF
from typing import Optional
from rank_bm25 import BM25Okapi
import asyncio

import os

from config import get_settings
from core.rag.embeddings import get_chroma_embedding_function
from core.ai.factory import get_ai_provider


_chroma_client: Optional[chromadb.ClientAPI] = None


def _get_chroma() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        settings = get_settings()
        chroma_url = getattr(settings, "CHROMA_URL", "")
        if chroma_url and not chroma_url.startswith("local"):
            _chroma_client = chromadb.HttpClient(
                host=chroma_url.replace("http://", "").split(":")[0],
                port=int(chroma_url.split(":")[-1])
            )
        else:
            persist_dir = os.environ.get("CHROMA_PERSIST_DIR", "/tmp/chroma_data")
            os.makedirs(persist_dir, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=persist_dir)
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

def chunk_text(text: str, chunk_size: int = 1000) -> list[str]:
    # Chunking 500-1000 tokens com 10% overlap
    overlap = int(chunk_size * 0.1)
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


def chunk_legal_structurally(text: str) -> list[dict]:
    """
    Advanced semantic/structural chunking for Brazilian legal texts.
    Identifies hierarchy: Artigo > Parágrafo > Inciso > Alínea.
    Injects context from parents to ensure RAG precision.
    """
    import re
    
    # Patterns for Brazilian legal structure
    ART_PATTERN = r'^((?:[Aa]rt\.|[Aa]rtigo)\s*\d+(?:[º°oOA-Z\-])*\.?\s*)'
    PAR_PATTERN = r'^((?:§\s*\d+|Parágrafo\s+único)\s*(?:[º°oOA-Z\-])*\.?\s*)'
    INC_PATTERN = r'^([IVXLCDM]+\s*-\s*)'
    ALI_PATTERN = r'^([a-z]\)\s*)'

    patterns = [
        ('art', ART_PATTERN),
        ('par', PAR_PATTERN),
        ('inc', INC_PATTERN),
        ('ali', ALI_PATTERN)
    ]
    
    # Combined pattern for finditer
    COMBINED = '|'.join(f'(?P<{name}>{pat})' for name, pat in patterns)
    
    matches = list(re.finditer(COMBINED, text, re.MULTILINE))
    
    if not matches:
        return [{"text": c, "metadata": {"article": "", "paragraph": "", "inciso": "", "alinea": "", "hierarchy": ""}} 
                for c in chunk_text(text)]

    chunks = []
    curr_art, curr_par, curr_inc, curr_ali = "", "", "", ""
    
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        
        segment_text = text[start:end].strip()
        if not segment_text:
            continue
            
        # Update current hierarchy based on match group
        if match.group('art'):
            curr_art = match.group('art').strip()
            curr_par, curr_inc, curr_ali = "", "", ""
        elif match.group('par'):
            curr_par = match.group('par').strip()
            curr_inc, curr_ali = "", ""
        elif match.group('inc'):
            curr_inc = match.group('inc').strip()
            curr_ali = ""
        elif match.group('ali'):
            curr_ali = match.group('ali').strip()

        # Build context header
        context_parts = [c for c in [curr_art, curr_par, curr_inc, curr_ali] if c]
        header = f"[{' '.join(context_parts)}] " if context_parts else ""
        
        chunks.append({
            "text": f"{header}{segment_text}",
            "metadata": {
                "article": curr_art,
                "paragraph": curr_par,
                "inciso": curr_inc,
                "alinea": curr_ali,
                "hierarchy": " > ".join(context_parts)
            }
        })

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


async def generate_chunk_summaries_in_batches(chunks: list[dict]) -> list[str]:
    ai = get_ai_provider()
    if not ai.is_configured():
        return [""] * len(chunks)
        
    async def summarize(chunk_dict):
        text = chunk_dict["text"]
        prompt = "Escreva um resumo de exatamente 2 frases capturando a essência jurídica ou factual do texto a seguir para indexação de busca:\n\n" + text[:1500]
        try:
            return await ai.generate(prompt)
        except Exception:
            return "Resumo indisponível."
            
    # Processa em paralelo (recomenda-se limite de concurrency via semaforo em prd massivo)
    tasks = [summarize(c) for c in chunks]
    return await asyncio.gather(*tasks)

async def index_document(workspace_id: str, doc_id: str, filename: str, text: str) -> int:
    """Index a workspace document, attempting to use legal structural chunking se possível."""
    if not text.strip():
        return 0
        
    chunks_data = chunk_legal_structurally(text)
    
    # 🌟 Geração Enriquecida de IA (Summary on Ingest)
    summaries = await generate_chunk_summaries_in_batches(chunks_data)
    
    collection = _get_workspace_collection(workspace_id)
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks_data))]
    documents = [c["text"] for c in chunks_data]
    metadatas = []
    
    for i, c in enumerate(chunks_data):
        meta = {
            "doc_id": doc_id, 
            "filename": filename, 
            "chunk_index": i,
            "summary": summaries[i][:300], # Protege o tamanho max do metadata
            **c.get("metadata", {})
        }
        metadatas.append(meta)
        
    collection.add(documents=documents, ids=ids, metadatas=metadatas)
    return len(chunks_data)


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
    Index legal structural chunks into the global 'legislacao_br' collection.
    chunks: [{"text": ..., "metadata": {...}}, ...]
    """
    if not chunks:
        return 0
    collection = _get_legal_collection()
    ids = [f"{law_id}_chunk_{i}" for i in range(len(chunks))]
    documents = [c["text"] for c in chunks]
    
    metadatas = []
    for i, c in enumerate(chunks):
        meta = {
            "law_name": law_name,
            "law_id": law_id,
            "chunk_index": i,
            **c.get("metadata", {})
        }
        metadatas.append(meta)
        
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

async def retrieve(workspace_id: str, query: str, top_k: int = 5, caso_id: Optional[str] = None) -> list[str]:
    """Retrieve with RRF (Reciprocal Rank Fusion) combining Semantic Dense and BM25 Sparse search."""
    try:
        collection = _get_workspace_collection(workspace_id)
        where_filter = {"caso_id": caso_id} if caso_id else None
        
        # 1. Obter todos os documentos relevantes para rodar BM25 em memória
        all_docs = collection.get(where=where_filter, include=["documents", "metadatas"])
        if not all_docs or not all_docs.get("documents"):
            return []
            
        docs_text = all_docs["documents"]
        doc_ids = all_docs["ids"]
        metadatas = all_docs["metadatas"]
        
        # 2. Dense Semantic Search (Chroma)
        semantic_results = collection.query(
            query_texts=[query], 
            n_results=min(top_k * 3, len(docs_text)),
            where=where_filter
        )
        
        dense_ranks = {}
        if semantic_results["ids"] and len(semantic_results["ids"]) > 0:
            for rank, doc_id in enumerate(semantic_results["ids"][0]):
                dense_ranks[doc_id] = rank + 1
                
        # 3. Sparse Keyword Search (BM25)
        tokenized_corpus = [doc.lower().split() for doc in docs_text]
        bm25 = BM25Okapi(tokenized_corpus)
        tokenized_query = query.lower().split()
        bm25_scores = bm25.get_scores(tokenized_query)
        
        sparse_ranking = sorted([
            (score, doc_id) for score, doc_id in zip(bm25_scores, doc_ids) if score > 0
        ], reverse=True, key=lambda x: x[0])
        
        sparse_ranks = {doc_id: rank + 1 for rank, (_, doc_id) in enumerate(sparse_ranking)}
        
        # 4. RRF (Reciprocal Rank Fusion)
        rrf_scores = {}
        k_rrf = 60 # Constante RRF clássica
        for doc_id in doc_ids:
            rrf_score = 0
            if doc_id in dense_ranks:
                rrf_score += 1 / (k_rrf + dense_ranks[doc_id])
            if doc_id in sparse_ranks:
                rrf_score += 1 / (k_rrf + sparse_ranks[doc_id])
            rrf_scores[doc_id] = rrf_score
            
        # Top-K
        top_ids = sorted(rrf_scores.keys(), key=lambda k: rrf_scores[k], reverse=True)[:top_k]
        
        final_docs = []
        for d_id in top_ids:
            if rrf_scores[d_id] == 0: continue
            idx = doc_ids.index(d_id)
            meta = metadatas[idx]
            # Adiciona citação rica para O Oraculo Themis
            final_docs.append(f"[Doc: {meta.get('filename', 'Desconhecido')}] {docs_text[idx]}")
            
        return final_docs
    except Exception as e:
        print(f"RAG retrieval RRF error: {e}")
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


async def retrieve_hybrid(workspace_id: str, query: str, caso_id: Optional[str] = None) -> dict:
    """
    Hybrid retrieval: legal base (top-5) + workspace docs (top-3).
    Returns {"legal": [...], "workspace": [...]}
    """
    legal = await retrieve_legal(query, top_k=5)
    workspace = await retrieve(workspace_id, query, top_k=3, caso_id=caso_id)
    return {"legal": legal, "workspace": workspace}
