import logging
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.peca import TIPO_LABELS
from models.template import TemplateCreateRequest, TipoPeca

logger = logging.getLogger(__name__)

COLLECTION = "templates"

def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    if isinstance(doc.get("criado_em"), datetime):
        doc["created_at"] = doc["criado_em"].isoformat()
    doc["tipo_label"] = TIPO_LABELS.get(TipoPeca(doc.get("tipo_peca")), "")
    return doc

async def list_public_templates(db: AsyncIOMotorDatabase) -> list[dict]:
    templates = []
    async for doc in db[COLLECTION].find({"is_public": True}).sort("downloads", -1):
        templates.append(_serialize(doc))
    return templates

async def create_template(
    db: AsyncIOMotorDatabase, request: TemplateCreateRequest, workspace_id: str
) -> dict:
    doc = {
        "titulo": request.titulo,
        "descricao": request.descricao,
        "tipo_peca": request.tipo_peca.value,
        "instrucoes_base": request.instrucoes_base,
        "autor_nome": request.autor_nome,
        "workspace_id": workspace_id,
        "is_public": True,
        "downloads": 0,
        "criado_em": datetime.now(timezone.utc),
    }
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)

async def register_use(db: AsyncIOMotorDatabase, template_id: str) -> Optional[dict]:
    updated = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(template_id)},
        {"$inc": {"downloads": 1}},
        return_document=True
    )
    if not updated:
        return None
    return _serialize(updated)
