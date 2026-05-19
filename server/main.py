from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import connect_db, disconnect_db
from core.ai.factory import get_ai_provider


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MongoDB — graceful: server starts even if DB is unreachable
    try:
        await connect_db()
    except Exception as e:
        print(f"⚠️  MongoDB connection failed (server will run without persistence): {e}")

    # AI Provider
    try:
        get_ai_provider()
        print("🤖 AI Provider initialized")
    except Exception as e:
        print(f"⚠️  AI Provider init failed: {e}")

    settings = get_settings()
    if not settings.OAB_DEMO_MODE:
        from core.legal.updater import start_legal_updater
        from core.notifications.scheduler import start_notification_scheduler
        asyncio.create_task(start_legal_updater())
        asyncio.create_task(start_notification_scheduler())
        print("🚀 Maia Platform API is ready! (Full Mode)")
    else:
        try:
            from core.rag.pipeline import _get_legal_collection
            from core.legal.scraper import scrape_all_laws
            from core.legal.seed_loader import process_seed_doctrine

            try:
                process_seed_doctrine()
            except Exception as e:
                print(f"Erro ao processar doctrine seed: {e}")

            col = _get_legal_collection()
            if col.count() < 1000:
                print("OAB Demo Boot: Base legal vazia. Iniciando scraping do Planalto em background...")
                asyncio.create_task(scrape_all_laws())
            else:
                print(f"OAB Demo Boot: Base legal pronta com {col.count()} chunks. (Scraping ignorado)")
        except Exception as e:
            print(f"Failed to boot OAB Demo legal base: {e}")

        print("⚖️  Maia API ready! (OAB Demo)")

    yield

    try:
        await disconnect_db()
    except Exception:
        pass
    print("👋 Maia Platform API shutting down.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"]
    )

    # ── Core routers (always active) ──
    from routers import health, chat, documents
    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(documents.router)

    # ── Full platform routers (disabled in OAB demo mode) ──
    if not settings.OAB_DEMO_MODE:
        from routers import (
            auth, casos, clientes, prazos, pecas,
            dashboard, audit, jurisprudencia, workspaces,
            templates, websockets, setup, protocol
        )
        app.include_router(auth.router)
        app.include_router(casos.router)
        app.include_router(clientes.router)
        app.include_router(prazos.router)
        app.include_router(pecas.router)
        app.include_router(dashboard.router)
        app.include_router(audit.router)
        app.include_router(jurisprudencia.router)
        app.include_router(workspaces.router)
        app.include_router(templates.router, prefix="/api/v1/templates", tags=["Templates"])
        app.include_router(websockets.router)
        app.include_router(setup.router)
        app.include_router(protocol.router, prefix="/api/v1")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
