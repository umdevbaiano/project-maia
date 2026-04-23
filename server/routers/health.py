from fastapi import APIRouter
from config import get_settings
from core.ai.factory import get_ai_provider
from database import get_database

router = APIRouter(tags=["health"])


@router.get("/")
async def health_check():
    settings, ai = get_settings(), get_ai_provider()
    db_status = "offline"
    try:
        if await get_database().command("ping"): db_status = "online"
    except Exception: pass

    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": settings.APP_VERSION,
        "database_mongo": db_status,
        "ai_provider": ai.get_model_name(),
        "ai_configured": ai.is_configured(),
    }
