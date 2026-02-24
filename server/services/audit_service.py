"""
Maia Platform — Audit Service
Registers and queries all user actions for compliance and traceability.
Each action is stored in the 'audit_log' collection, scoped by workspace.
"""
from datetime import datetime
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase


COLLECTION = "audit_log"

# Allowed action types
ACTIONS = {"LOGIN", "REGISTER", "INVITE", "REVOKE", "CREATE", "UPDATE", "DELETE", "EXPORT", "GENERATE", "CHAT", "SYNC", "UPLOAD", "CLEAR"}

# Allowed resource types
RESOURCE_TYPES = {"auth", "caso", "cliente", "prazo", "peca", "documento", "chat"}


async def log_action(
    db: AsyncIOMotorDatabase,
    *,
    workspace_id: str,
    user_id: str,
    user_email: str = "",
    action: str,
    resource_type: str,
    resource_id: str = "",
    details: str = "",
    ip_address: str = "",
) -> None:
    """
    Record an audit event. Fire-and-forget — errors are swallowed
    so that audit logging never breaks the main flow.
    """
    try:
        doc = {
            "workspace_id": workspace_id,
            "user_id": user_id,
            "user_email": user_email,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow(),
        }
        await db[COLLECTION].insert_one(doc)
    except Exception as e:
        # Never let audit failures break the app
        print(f"[AUDIT] Error logging action: {e}")


async def get_audit_logs(
    db: AsyncIOMotorDatabase,
    workspace_id: str,
    *,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """
    Query audit logs with optional filters and pagination.
    Returns { logs: [...], total: int, page: int, per_page: int }.
    """
    query: dict = {"workspace_id": workspace_id}

    if action:
        query["action"] = action
    if resource_type:
        query["resource_type"] = resource_type
    if user_id:
        query["user_id"] = user_id

    # Date range filter
    if date_from or date_to:
        date_filter: dict = {}
        if date_from:
            try:
                date_filter["$gte"] = datetime.fromisoformat(date_from)
            except ValueError:
                pass
        if date_to:
            try:
                date_filter["$lte"] = datetime.fromisoformat(date_to)
            except ValueError:
                pass
        if date_filter:
            query["timestamp"] = date_filter

    collection = db[COLLECTION]
    total = await collection.count_documents(query)

    skip = (page - 1) * per_page
    cursor = collection.find(query).sort("timestamp", -1).skip(skip).limit(per_page)

    logs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if isinstance(doc.get("timestamp"), datetime):
            doc["timestamp"] = doc["timestamp"].isoformat()
        logs.append(doc)

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "per_page": per_page,
    }
