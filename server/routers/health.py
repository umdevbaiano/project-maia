from fastapi import APIRouter
from config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_ping():
    """Minimal health check — always responds, no dependencies."""
    return {"status": "ok"}


@router.get("/")
async def health_check():
    settings = get_settings()
    db_status = "offline"
    ai_status = "offline"
    ai_model = "unknown"

    try:
        from database import get_database
        if await get_database().command("ping"):
            db_status = "online"
    except Exception:
        pass

    try:
        from core.ai.factory import get_ai_provider
        ai = get_ai_provider()
        ai_model = ai.get_model_name()
        ai_status = "configured" if ai.is_configured() else "not_configured"
    except Exception:
        pass

    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": settings.APP_VERSION,
        "database_mongo": db_status,
        "ai_provider": ai_model,
        "ai_status": ai_status,
    }
