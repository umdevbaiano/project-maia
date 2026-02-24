"""
Maia Platform — Health Check Router
"""
from fastapi import APIRouter
from config import get_settings
from core.ai.factory import get_ai_provider

router = APIRouter(tags=["health"])


@router.get("/")
async def health_check():
    """Health check endpoint."""
    settings = get_settings()
    ai_provider = get_ai_provider()

    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": settings.APP_VERSION,
        "ai_provider": ai_provider.get_model_name(),
        "ai_configured": ai_provider.is_configured(),
    }
