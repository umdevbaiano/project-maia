from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from utils.saas_config import get_plan_limits
from services.auth_service import WORKSPACES_COLLECTION, USERS_COLLECTION

async def check_user_quota(db: AsyncIOMotorDatabase, workspace_id: str) -> None:
    workspace = await db[WORKSPACES_COLLECTION].find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise ValueError("Workspace não encontrado.")
    
    limits = get_plan_limits(workspace.get("plan", "basic"))
    users_count = await db[USERS_COLLECTION].count_documents({"workspace_id": workspace_id, "is_active": True})
    
    if users_count >= limits["max_users"]:
        raise ValueError(f"Limite de usuários alcançado ({limits['max_users']}). Faça upgrade do plano.")

async def check_and_increment_ai_quota(db: AsyncIOMotorDatabase, workspace_id: str) -> None:
    workspace = await db[WORKSPACES_COLLECTION].find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise ValueError("Workspace não encontrado.")
        
    limits = get_plan_limits(workspace.get("plan", "basic"))
    calls_count = workspace.get("ai_calls_count", 0)
    reset_date = workspace.get("ai_calls_reset_date")
    now = datetime.now(timezone.utc)
    
    if not reset_date or now > reset_date.replace(tzinfo=timezone.utc):
        calls_count = 0
        reset_date = now + relativedelta(months=1)
        await db[WORKSPACES_COLLECTION].update_one(
            {"_id": ObjectId(workspace_id)},
            {"$set": {"ai_calls_count": 0, "ai_calls_reset_date": reset_date}}
        )
        
    if calls_count >= limits["max_ai_calls"]:
        raise ValueError(f"Limite de IA alcançado ({limits['max_ai_calls']}). Faça upgrade do plano.")
        
    await db[WORKSPACES_COLLECTION].update_one(
        {"_id": ObjectId(workspace_id)},
        {"$inc": {"ai_calls_count": 1}}
    )

async def record_ai_telemetry(db: AsyncIOMotorDatabase, workspace_id: str, input_tokens: int, output_tokens: int, route: str = "general"):
    telemetry_doc = {
        "workspace_id": workspace_id,
        "timestamp": datetime.now(timezone.utc),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "route": route
    }
    await db["ai_telemetry"].insert_one(telemetry_doc)
    await db[WORKSPACES_COLLECTION].update_one(
        {"_id": ObjectId(workspace_id)},
        {"$inc": {"billing_tokens_used": input_tokens + output_tokens}}
    )

async def get_workspace_usage(db: AsyncIOMotorDatabase, workspace_id: str) -> dict:
    workspace = await db[WORKSPACES_COLLECTION].find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise ValueError("Workspace não encontrado.")
        
    limits = get_plan_limits(workspace.get("plan", "basic"))
    users_count = await db[USERS_COLLECTION].count_documents({"workspace_id": workspace_id, "is_active": True})
    
    reset_date = workspace.get("ai_calls_reset_date")
    if reset_date and reset_date.tzinfo is None:
        reset_date = reset_date.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    calls_count = workspace.get("ai_calls_count", 0)
    if reset_date and now > reset_date:
        calls_count = 0

    return {
        "plan": workspace.get("plan", "basic"),
        "plan_name": limits["name"],
        "users": {"used": users_count, "max": limits["max_users"]},
        "ai_calls": {
            "used": calls_count,
            "max": limits["max_ai_calls"],
            "reset_date": reset_date.isoformat() if reset_date else None
        },
        "storage": {
            "used_mb": workspace.get("storage_bytes_used", 0) / (1024 * 1024),
            "max_mb": limits["max_storage_mb"]
        }
    }
