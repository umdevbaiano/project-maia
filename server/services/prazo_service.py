"""
Maia Platform — Deadline Service
"""
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from core.security.encryption import encrypt_field, decrypt_field

COLLECTION = "prazos"


def _serialize(doc: dict) -> dict:
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        for k in ("created_at", "updated_at"):
            if isinstance(doc.get(k), datetime):
                doc[k] = doc[k].isoformat()
        for field in ["titulo", "descricao"]:
            if doc.get(field):
                try:
                    doc[field] = decrypt_field(doc[field])
                except Exception:
                    pass
    return doc


async def create_prazo(db: AsyncIOMotorDatabase, data: dict, workspace_id: str, user_id: str) -> dict:
    now = datetime.utcnow()
    secure_data = data.copy()
    for field in ["titulo", "descricao"]:
        if secure_data.get(field):
            secure_data[field] = encrypt_field(str(secure_data[field]))
            
    doc = {**secure_data, "workspace_id": workspace_id, "created_by": user_id, "created_at": now, "updated_at": now}
    result = await db[COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def list_prazos(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
    status: Optional[str] = None,
    caso_id: Optional[str] = None,
) -> list[dict]:
    query: dict = {"workspace_id": workspace_id}
    if status:
        query["status"] = status
    if caso_id:
        query["caso_id"] = caso_id

    prazos = []
    async for doc in db[COLLECTION].find(query).sort("data_limite", 1):
        # Join case title
        if doc.get("caso_id"):
            try:
                caso = await db["casos"].find_one({"_id": ObjectId(doc["caso_id"])})
                doc["caso_titulo"] = caso["titulo"] if caso else None
            except Exception:
                doc["caso_titulo"] = None
        prazos.append(_serialize(doc))
    return prazos


async def get_prazo(db: AsyncIOMotorDatabase, prazo_id: str, workspace_id: str) -> Optional[dict]:
    try:
        doc = await db[COLLECTION].find_one({"_id": ObjectId(prazo_id), "workspace_id": workspace_id})
        return _serialize(doc) if doc else None
    except Exception:
        return None


async def update_prazo(db: AsyncIOMotorDatabase, prazo_id: str, workspace_id: str, data: dict) -> Optional[dict]:
    update_data = {k: v for k, v in data.items() if v is not None}
    if not update_data:
        return await get_prazo(db, prazo_id, workspace_id)
        
    for field in ["titulo", "descricao"]:
        if update_data.get(field):
            update_data[field] = encrypt_field(str(update_data[field]))
    
    if "data_limite" in update_data:
        update_data["notified"] = False
        
    update_data["updated_at"] = datetime.utcnow()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(prazo_id), "workspace_id": workspace_id},
        {"$set": update_data},
    )
    return await get_prazo(db, prazo_id, workspace_id)


async def delete_prazo(db: AsyncIOMotorDatabase, prazo_id: str, workspace_id: str) -> bool:
    result = await db[COLLECTION].delete_one({"_id": ObjectId(prazo_id), "workspace_id": workspace_id})
    return result.deleted_count > 0


async def get_dashboard_alerts(db: AsyncIOMotorDatabase, workspace_id: str) -> dict:
    """
    Return upcoming (next 7 days) and overdue deadlines for dashboard alerts (RF-32).
    """
    now = datetime.utcnow()
    seven_days = (now + timedelta(days=7)).strftime("%Y-%m-%d")
    today = now.strftime("%Y-%m-%d")

    # Overdue: pendente + data_limite < today
    overdue = []
    async for doc in db[COLLECTION].find({
        "workspace_id": workspace_id,
        "status": "pendente",
        "data_limite": {"$lt": today},
    }).sort("data_limite", 1):
        if doc.get("caso_id"):
            try:
                caso = await db["casos"].find_one({"_id": ObjectId(doc["caso_id"])})
                doc["caso_titulo"] = caso["titulo"] if caso else None
            except Exception:
                doc["caso_titulo"] = None
        overdue.append(_serialize(doc))

    # Upcoming: pendente + today <= data_limite <= today+7
    upcoming = []
    async for doc in db[COLLECTION].find({
        "workspace_id": workspace_id,
        "status": "pendente",
        "data_limite": {"$gte": today, "$lte": seven_days},
    }).sort("data_limite", 1):
        if doc.get("caso_id"):
            try:
                caso = await db["casos"].find_one({"_id": ObjectId(doc["caso_id"])})
                doc["caso_titulo"] = caso["titulo"] if caso else None
            except Exception:
                doc["caso_titulo"] = None
        upcoming.append(_serialize(doc))

    return {
        "overdue": overdue,
        "overdue_count": len(overdue),
        "upcoming": upcoming,
        "upcoming_count": len(upcoming),
    }
