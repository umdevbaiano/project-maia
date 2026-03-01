"""
Maia Platform — Legal Base Seed Script
Downloads Brazilian federal legislation and indexes it in ChromaDB.

Usage:
    docker exec maia-backend python scripts/seed_legal_base.py
"""
import sys
import os
import time

# Add parent to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.legal.scraper import scrape_all_laws
from core.rag.pipeline import chunk_by_article, index_legal_chunks, get_legal_collection_count


def main():
    print("=" * 60)
    print("📚 Maia Platform — Indexação da Base Legal Brasileira")
    print("=" * 60)
    print()

    start_time = time.time()

    # 1. Scrape all laws
    print("📥 Fase 1: Baixando legislação do planalto.gov.br...\n")
    laws = scrape_all_laws()
    print(f"\n✅ {len(laws)} leis baixadas com sucesso.\n")

    # 2. Chunk and index
    print("🔧 Fase 2: Chunking por artigo e indexação no ChromaDB...\n")
    total_chunks = 0

    for law in laws:
        chunks = chunk_by_article(law["text"])
        count = index_legal_chunks(law["law_name"], law["law_id"], chunks)
        total_chunks += count
        print(f"   ✅ {law['law_name']}: {count} artigos indexados")

    elapsed = time.time() - start_time

    print()
    print("=" * 60)
    print("🎉 Indexação completa!")
    print(f"   📊 Total: {total_chunks} artigos de {len(laws)} leis")
    print(f"   💾 Coleção ChromaDB: legislacao_br ({get_legal_collection_count()} registros)")
    print(f"   ⏱️  Tempo: {elapsed:.1f}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
