"""
Maia Platform — Legal Base Auto-Updater
Periodically checks planalto.gov.br for changes and re-indexes updated laws.
Runs as a background task in the FastAPI lifespan.
"""
import asyncio
from datetime import datetime

from core.legal.scraper import scrape_single_law, LAWS_REGISTRY
from core.rag.pipeline import chunk_legal_structurally, index_legal_chunks

# Store hashes in memory (could be persisted to MongoDB for production)
_law_hashes: dict[str, str] = {}
_update_interval_hours: int = 168  # 7 days


async def check_and_update_laws():
    """Check all laws for updates and re-index if changed."""
    global _law_hashes
    updated = 0

    for law_id, law_name, _ in LAWS_REGISTRY:
        try:
            result = scrape_single_law(law_id)
            if not result:
                continue

            new_hash = result["hash"]
            old_hash = _law_hashes.get(law_id)

            if old_hash and old_hash == new_hash:
                continue  # No changes

            # Law changed or first check — re-index
            chunks = chunk_legal_structurally(result["text"])
            count = index_legal_chunks(result["law_name"], result["law_id"], chunks)
            _law_hashes[law_id] = new_hash
            updated += 1
            print(f"🔄 {law_name}: re-indexado ({count} artigos)")

        except Exception as e:
            print(f"❌ Erro ao verificar {law_name}: {e}")

    if updated > 0:
        print(f"✅ Atualização legal concluída: {updated} lei(s) atualizada(s) em {datetime.utcnow().isoformat()}")
    else:
        print(f"✅ Base legal verificada — sem alterações ({datetime.utcnow().isoformat()})")


async def start_legal_updater():
    """
    Background task: checks for legal updates every 7 days.
    Call this from the FastAPI lifespan.
    """
    print(f"⏰ Auto-updater legal iniciado (intervalo: {_update_interval_hours}h)")

    while True:
        await asyncio.sleep(_update_interval_hours * 3600)
        try:
            print("🔍 Verificando atualizações na legislação...")
            await check_and_update_laws()
        except Exception as e:
            print(f"❌ Erro no auto-updater: {e}")
