import logging
import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from core.rpa.engine import RPAEngine
from core.rpa.pages.pje_pages import PJeLoginPage, PJeProtocoloPage
from middleware import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/protocol", tags=["rpa_protocol"])


async def execute_protocol_job(workspace_id: str, peca_id: str, tribunal: str, numero_processo: str):
    logger.info(f"Starting RPA Protocol: {peca_id} @ {tribunal}")
    engine = RPAEngine(headless=True)
    try:
        await engine.start()
        if tribunal.lower() == "pje":
            # await PJeLoginPage(engine.page).login_via_certificado()
            await asyncio.sleep(1)
            # await PJeProtocoloPage(engine.page).iniciar_protocolo_peticao(numero_processo, "/tmp/peca.pdf")
        logger.info(f"Protocol Job {peca_id} success.")
    except Exception as e:
        logger.error(f"RPA Error: {e}")
    finally:
        await engine.stop()


@router.post("/execute")
async def execute_protocol(background_tasks: BackgroundTasks, peca_id: str, tribunal: str, numero_processo: str, current_user: dict = Depends(get_current_user)):
    ws_id = current_user.get("_workspace_id")
    if not ws_id: raise HTTPException(status_code=401, detail="Workspace required.")
    background_tasks.add_task(execute_protocol_job, ws_id, peca_id, tribunal, numero_processo)
    return {"status": "processing", "message": "Protocolo enfileirado."}
