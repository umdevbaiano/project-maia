"""
Maia Platform — Application Entrypoint
Clean FastAPI setup with lifespan, routers, and CORS.
"""
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import connect_db, disconnect_db
from core.ai.factory import get_ai_provider
from routers import health, chat, auth, documents, casos, clientes, prazos, pecas, dashboard, audit, jurisprudencia
from core.legal.updater import start_legal_updater
from core.notifications.scheduler import start_notification_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    
    # Initialize AI Provider
    ai_provider = get_ai_provider()
    print("🤖 AI Provider initialized")
    print("🚀 Maia Platform API is ready!")

    # Start background auto-updater for legal base
    asyncio.create_task(start_legal_updater())
    
    # Start background scheduler for email notifications
    asyncio.create_task(start_notification_scheduler())
    
    yield
    
    # Shutdown
    print("INFO:     Shutting down")
    await disconnect_db()
    print("👋 Maia Platform API shutting down.")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(chat.router)
    app.include_router(documents.router)
    app.include_router(casos.router)
    app.include_router(clientes.router)
    app.include_router(prazos.router)
    app.include_router(pecas.router)
    app.include_router(dashboard.router)
    app.include_router(audit.router)
    app.include_router(jurisprudencia.router)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
