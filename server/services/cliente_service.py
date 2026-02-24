"""
Maia Platform — Client Service
"""
from datetime import datetime
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

COLLECTION = "clientes"


def _serialize(doc: dict) -> dict:
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        for k in ("created_at", "updated_at"):
            if isinstance(doc.get(k), datetime):
                doc[k] = doc[k].isoformat()
    return doc


async def create_cliente(db: AsyncIOMotorDatabase, data: dict, workspace_id: str) -> dict:
    now = datetime.utcnow()
    doc = {**data, "workspace_id": workspace_id, "created_at": now, "updated_at": now}
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_clientes(
    db: AsyncIOMotorDatabase, workspace_id: str, search: Optional[str] = None
) -> list[dict]:
    query: dict = {"workspace_id": workspace_id}
    if search:
        query["$or"] = [
            {"nome": {"$regex": search, "$options": "i"}},
            {"documento": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    clientes = []
    async for doc in db[COLLECTION].find(query).sort("nome", 1):
        clientes.append(_serialize(doc))
    return clientes


async def get_cliente(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str) -> Optional[dict]:
    try:
        doc = await db[COLLECTION].find_one({"_id": ObjectId(cliente_id), "workspace_id": workspace_id})
        return _serialize(doc) if doc else None
    except Exception:
        return None


async def update_cliente(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str, data: dict) -> Optional[dict]:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_cliente(db, cliente_id, workspace_id)
    update_data["updated_at"] = datetime.utcnow()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(cliente_id), "workspace_id": workspace_id},
        {"$set": update_data},
    )
    return await get_cliente(db, cliente_id, workspace_id)


async def delete_cliente(db: AsyncIOMotorDatabase, cliente_id: str, workspace_id: str) -> bool:
    result = await db[COLLECTION].delete_one({"_id": ObjectId(cliente_id), "workspace_id": workspace_id})
    return result.deleted_count > 0
