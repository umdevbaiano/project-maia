import re
import json
from datetime import datetime
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.security.encryption import encrypt_field, decrypt_field

COLLECTION = "casos"


def _serialize(doc: dict) -> dict:
    if not doc: return doc
    doc["id"] = str(doc.pop("_id"))
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), datetime): doc[k] = doc[k].isoformat()
    if doc.get("descricao"): doc["descricao"] = decrypt_field(doc["descricao"])
    return doc


def _encrypt_payload(data: dict) -> dict:
    encrypted = data.copy()
    if encrypted.get("descricao"): encrypted["descricao"] = encrypt_field(str(encrypted["descricao"]))
    return encrypted


async def create_caso(db: AsyncIOMotorDatabase, data: dict, workspace_id: str, user_id: str) -> dict:
    now = datetime.utcnow()
    doc = {**_encrypt_payload(data), "workspace_id": workspace_id, "created_by": user_id, "created_at": now, "updated_at": now}
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_casos(db: AsyncIOMotorDatabase, workspace_id: str, status: Optional[str] = None, tipo: Optional[str] = None, search: Optional[str] = None) -> list[dict]:
    query = {"workspace_id": workspace_id}
    if status: query["status"] = status
    if tipo: query["tipo"] = tipo
    if search: query["$or"] = [{"titulo": {"$regex": search, "$options": "i"}}, {"numero": {"$regex": search, "$options": "i"}}]

    casos = []
    async for doc in db[COLLECTION].find(query).sort("updated_at", -1):
        if doc.get("cliente_id"):
            try:
                client = await db["clientes"].find_one({"_id": ObjectId(doc["cliente_id"])})
                doc["cliente_nome"] = client["nome"] if client else None
            except: doc["cliente_nome"] = None
        casos.append(_serialize(doc))
    return casos


async def get_caso(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str) -> Optional[dict]:
    try:
        doc = await db[COLLECTION].find_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
        return _serialize(doc) if doc else None
    except: return None


async def update_caso(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str, data: dict) -> Optional[dict]:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data: return await get_caso(db, caso_id, workspace_id)
    
    secure_data = _encrypt_payload(update_data)
    secure_data["updated_at"] = datetime.utcnow()
    await db[COLLECTION].update_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id}, {"$set": secure_data})
    return await get_caso(db, caso_id, workspace_id)


async def delete_caso(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str) -> bool:
    return (await db[COLLECTION].delete_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})).deleted_count > 0


async def generate_case_analytics(db: AsyncIOMotorDatabase, ai: any, caso_id: str, workspace_id: str) -> Optional[dict]:
    caso = await get_caso(db, caso_id, workspace_id)
    if not caso: return None

    prompt = f"""
SISTEMA: Maia (Analista Preditiva)
OBJETIVO: Probabilidade de êxito, Riscos e Recomendações.

PROCESSO:
- Título: {caso.get('titulo')}
- Tipo: {caso.get('tipo')}
- Tribunal: {caso.get('tribunal')}
- Fatos: {caso.get('descricao')}

RESPONDA APENAS JSON:
{{
    "score": 0.0-1.0,
    "label": "Improvável"|"Possível"|"Provável",
    "justificativa": "Texto",
    "riscos": [],
    "recomendacoes": []
}}
"""
    try:
        raw = await ai.generate(prompt)
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            analytics = json.loads(match.group(0))
            await db[COLLECTION].update_one({"_id": ObjectId(caso_id)}, {"$set": {"predictive_analytics": analytics}})
            return analytics
    except: pass
    return None
