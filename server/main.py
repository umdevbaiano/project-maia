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
from routers import health, chat, auth, documents, casos, clientes, prazos
from core.legal.updater import start_legal_updater


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    # Startup
    await connect_db()
    get_ai_provider()
    # Start legal auto-updater in background
    asyncio.create_task(start_legal_updater())
    print("🚀 Maia Platform API is ready!")
    yield
    # Shutdown
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

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
