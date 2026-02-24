"""
Maia Platform — Case Service
"""
from datetime import datetime
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "casos"


def _serialize(doc: dict) -> dict:
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        for k in ("created_at", "updated_at"):
            if isinstance(doc.get(k), datetime):
                doc[k] = doc[k].isoformat()
    return doc


async def create_caso(db: AsyncIOMotorDatabase, data: dict, workspace_id: str, user_id: str) -> dict:
    now = datetime.utcnow()
    doc = {
        **data,
        "workspace_id": workspace_id,
        "created_by": user_id,
        "created_at": now,
        "updated_at": now,
    }
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_casos(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    query: dict = {"workspace_id": workspace_id}
    if status:
        query["status"] = status
    if tipo:
        query["tipo"] = tipo
    if search:
        query["$or"] = [
            {"titulo": {"$regex": search, "$options": "i"}},
            {"numero": {"$regex": search, "$options": "i"}},
        ]

    casos = []
    cursor = db[COLLECTION].find(query).sort("updated_at", -1)
    async for doc in cursor:
        # Try to join client name
        if doc.get("cliente_id"):
            try:
                client = await db["clientes"].find_one({"_id": ObjectId(doc["cliente_id"])})
                doc["cliente_nome"] = client["nome"] if client else None
            except Exception:
                doc["cliente_nome"] = None
        casos.append(_serialize(doc))
    return casos


async def get_caso(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str) -> Optional[dict]:
    try:
        doc = await db[COLLECTION].find_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
        return _serialize(doc) if doc else None
    except Exception:
        return None


async def update_caso(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str, data: dict) -> Optional[dict]:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_caso(db, caso_id, workspace_id)
    update_data["updated_at"] = datetime.utcnow()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(caso_id), "workspace_id": workspace_id},
        {"$set": update_data},
    )
    return await get_caso(db, caso_id, workspace_id)


async def delete_caso(db: AsyncIOMotorDatabase, caso_id: str, workspace_id: str) -> bool:
    result = await db[COLLECTION].delete_one({"_id": ObjectId(caso_id), "workspace_id": workspace_id})
    return result.deleted_count > 0
