from datetime import datetime
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.security.encryption import encrypt_field, decrypt_field

COLLECTION = "clientes"
SENSITIVE_FIELDS = ["documento", "email", "telefone", "endereco", "observacoes"]


def _serialize(doc: dict) -> dict:
    if not doc: return doc
    doc["id"] = str(doc.pop("_id"))
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), datetime): doc[k] = doc[k].isoformat()
    for f in SENSITIVE_FIELDS:
        if doc.get(f): doc[f] = decrypt_field(doc[f])
    return doc


def _encrypt_payload(data: dict) -> dict:
    encrypted = data.copy()
    for f in SENSITIVE_FIELDS:
        if encrypted.get(f): encrypted[f] = encrypt_field(str(encrypted[f]))
    return encrypted


async def create_cliente(db: AsyncIOMotorDatabase, data: dict, workspace_id: str) -> dict:
    now = datetime.utcnow()
    doc = {**_encrypt_payload(data), "workspace_id": workspace_id, "created_at": now, "updated_at": now}
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_clientes(db: AsyncIOMotorDatabase, workspace_id: str, search: Optional[str] = None) -> list[dict]:
    query = {"workspace_id": workspace_id}
    if search: query["nome"] = {"$regex": search, "$options": "i"}
    return [_serialize(doc) async for doc in db[COLLECTION].find(query).sort("nome", 1)]


async def get_cliente(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str) -> Optional[dict]:
    try:
        doc = await db[COLLECTION].find_one({"_id": ObjectId(cliente_id), "workspace_id": workspace_id})
        return _serialize(doc) if doc else None
    except: return None


async def update_cliente(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str, data: dict) -> Optional[dict]:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data: return await get_cliente(db, cliente_id, workspace_id)
    
    secure_data = _encrypt_payload(update_data)
    secure_data["updated_at"] = datetime.utcnow()
    await db[COLLECTION].update_one({"_id": ObjectId(cliente_id), "workspace_id": workspace_id}, {"$set": secure_data})
    return await get_cliente(db, cliente_id, workspace_id)


async def delete_cliente(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str) -> bool:
    return (await db[COLLECTION].delete_one({"_id": ObjectId(cliente_id), "workspace_id": workspace_id})).deleted_count > 0


async def get_cliente_report(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str) -> Optional[dict]:
    cliente = await get_cliente(db, cliente_id, workspace_id)
    if not cliente: return None

    async def get_related(coll, q, sort_f):
        items = []
        async for d in db[coll].find(q).sort(sort_f, -1):
            d["id"] = str(d.pop("_id"))
            for k in (sort_f, "updated_at", "created_at"):
                if isinstance(d.get(k), datetime): d[k] = d[k].isoformat()
            if d.get("descricao"):
                try: d["descricao"] = decrypt_field(d["descricao"])
                except: pass
            items.append(d)
        return items

    return {
        "cliente": cliente,
        "casos": await get_related("casos", {"cliente_id": cliente_id, "workspace_id": workspace_id}, "created_at"),
        "documentos": await get_related("documentos", {"cliente_id": cliente_id, "workspace_id": workspace_id}, "upload_date")
    }
