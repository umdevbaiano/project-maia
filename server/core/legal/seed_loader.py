"""
Maia Platform — Doctrine Seed Loader
Scans the /server/data/seed_doctrine folder for PDFs.
Extracts text, chunks it, and injects into the global 'legislacao_br' collection.
Used to easily load doctrine manuals and large books offline, without using AI quota.
"""
import os
import shutil
import fitz  # PyMuPDF
from core.rag.pipeline import _get_legal_collection

SEED_DIR = "/app/data/seed_doctrine"
PROCESSED_DIR = os.path.join(SEED_DIR, "processed")
def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> list[str]:
    """Simple character-based text chunking with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end >= len(text):
            chunks.append(text[start:])
            break
            
        # Try to find a natural break point (newline or period) near the end
        break_point = text.rfind("\n", start, end)
        if break_point == -1 or break_point < start + (chunk_size // 2):
            break_point = text.rfind(". ", start, end)
            
        if break_point != -1 and break_point > start + (chunk_size // 2):
            end = break_point + 1
            
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

def process_seed_doctrine():
    """Scan and index all PDFs in the seed directory."""
    if not os.path.exists(SEED_DIR):
        os.makedirs(PROCESSED_DIR, exist_ok=True)
        return

    os.makedirs(PROCESSED_DIR, exist_ok=True)

    files = [f for f in os.listdir(SEED_DIR) if f.lower().endswith(".pdf")]
    if not files:
        return
        
    print(f"📚 Encontrados {len(files)} arquivos de doutrina na pasta seed. Iniciando indexação...")
    collection = _get_legal_collection()
    
    for filename in files:
        filepath = os.path.join(SEED_DIR, filename)
        doc_name = os.path.splitext(filename)[0]
        try:
            print(f"  📖 Lendo: {filename}...")
            text = ""
            with fitz.open(filepath) as doc:
                for page in doc:
                    text += page.get_text() + "\n"
                    
            if not text.strip():
                print(f"  ⚠️ {filename} não contém texto extraível.")
                continue
                
            chunks = chunk_text(text)
            
            # Prepare for ChromaDB
            ids = [f"seed_{doc_name}_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "law_id": f"seed_{doc_name}",
                    "law_name": f"Doutrina: {doc_name}",
                    "hierarchy": f"Chunk {i}",
                    "type": "doctrine"
                }
                for i in range(len(chunks))
            ]
            
            # Batch insert to avoid ChromaDB payload limits
            batch_size = 100
            for i in range(0, len(chunks), batch_size):
                collection.add(
                    documents=chunks[i:i+batch_size],
                    metadatas=metadatas[i:i+batch_size],
                    ids=ids[i:i+batch_size]
                )
                
            print(f"  ✅ Indexado: {filename} ({len(chunks)} chunks)")
            
            # Move to processed
            shutil.move(filepath, os.path.join(PROCESSED_DIR, filename))
            
        except Exception as e:
            print(f"  ❌ Erro ao processar {filename}: {e}")
