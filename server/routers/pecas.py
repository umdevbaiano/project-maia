import urllib.parse
import json
from typing import Literal
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from database import get_database
from middleware import get_current_user
from middleware.rate_limiter import RateLimiter
from core.ai.factory import get_ai_provider
from core.documents.docx_generator import markdown_to_docx
from core.documents.pdf_generator import markdown_to_pdf
from models.peca import PecaGenerateRequest, PecaResponse, PecaUpdateRequest, PecaSignatureRequest, PecaBundleRequest
from services import peca_service, audit_service
from services.saas_service import check_and_increment_ai_quota

router = APIRouter(prefix="/pecas", tags=["pecas"])


@router.post("/generate", response_model=PecaResponse)
async def generate_peca(request: PecaGenerateRequest, current_user: dict = Depends(get_current_user), _: None = Depends(RateLimiter(requests=10, window_seconds=60))):
    db, workspace_id = get_database(), current_user["_workspace_id"]
    try:
        await check_and_increment_ai_quota(db, workspace_id)
    except ValueError as ve:
        raise HTTPException(status_code=402, detail=str(ve))

    result = await peca_service.generate_peca(db, get_ai_provider(), workspace_id, current_user["_user_id"], request.tipo, request.instrucoes, request.caso_id)
    await audit_service.log_action(db, workspace_id, current_user["_user_id"], current_user.get("email", ""), "GENERATE", "peca", resource_id=result.get("id", ""), details=f"Tipo: {request.tipo}")
    return PecaResponse(**result)


@router.post("/stream")
async def stream_peca(request: PecaGenerateRequest, current_user: dict = Depends(get_current_user), _: None = Depends(RateLimiter(requests=10, window_seconds=60))):
    db, workspace_id, user_id = get_database(), current_user["_workspace_id"], current_user["_user_id"]
    try:
        await check_and_increment_ai_quota(db, workspace_id)
    except ValueError as ve:
        raise HTTPException(status_code=402, detail=str(ve))

    async def event_generator():
        try:
            async for chunk in peca_service.generate_peca_stream(db, get_ai_provider(), workspace_id, user_id, request.tipo, request.instrucoes, request.caso_id):
                yield f"data: {json.dumps({'chunk': chunk})}\\n\\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\\n\\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.post("/bundle", response_model=list[PecaResponse])
async def generate_peca_bundle(request: PecaBundleRequest, current_user: dict = Depends(get_current_user), _: None = Depends(RateLimiter(requests=5, window_seconds=60))):
    db, workspace_id, user_id = get_database(), current_user["_workspace_id"], current_user["_user_id"]
    try:
        for _ in range(3): await check_and_increment_ai_quota(db, workspace_id)
    except ValueError as ve:
        raise HTTPException(status_code=402, detail=str(ve))

    results = await peca_service.generate_peca_bundle(db, get_ai_provider(), workspace_id, user_id, request.caso_id, request.instrucoes)
    await audit_service.log_action(db, workspace_id, user_id, current_user.get("email", ""), "GENERATE_BUNDLE", "peca", details=f"Kit generated with {len(results)} docs")
    return [PecaResponse(**r) for r in results]


@router.get("/")
async def list_pecas(current_user: dict = Depends(get_current_user)):
    return {"pecas": await peca_service.list_pecas(get_database(), current_user["_workspace_id"])}


@router.get("/{peca_id}", response_model=PecaResponse)
async def get_peca(peca_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    peca = await peca_service.get_peca(db, peca_id, current_user["_workspace_id"])
    if not peca: raise HTTPException(status_code=404, detail="Peça não encontrada.")
    return PecaResponse(**peca)


@router.delete("/{peca_id}")
async def delete_peca(peca_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if not await peca_service.delete_peca(db, peca_id, current_user["_workspace_id"]):
        raise HTTPException(status_code=404, detail="Peça não encontrada.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "DELETE", "peca", resource_id=peca_id)
    return {"message": "Peça removida com sucesso."}


@router.put("/{peca_id}", response_model=PecaResponse)
async def update_peca(peca_id: str, request: PecaUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    updated = await peca_service.update_peca(db, peca_id, current_user["_workspace_id"], request.model_dump(exclude_unset=True))
    if not updated: raise HTTPException(status_code=404, detail="Peça não encontrada.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "UPDATE", "peca", resource_id=peca_id)
    return PecaResponse(**updated)


@router.get("/{peca_id}/download")
async def download_peca(peca_id: str, format: Literal["docx", "pdf"] = Query(default="docx"), current_user: dict = Depends(get_current_user)):
    db = get_database()
    peca = await peca_service.get_peca(db, peca_id, current_user["_workspace_id"])
    if not peca: raise HTTPException(status_code=404, detail="Peça não encontrada.")

    workspace_name = ""
    ws = await db["workspaces"].find_one({"_id": ObjectId(current_user["_workspace_id"])})
    if ws: workspace_name = ws.get("workspace_name", "")

    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "EXPORT", "peca", resource_id=peca_id, details=f"Download {format.upper()}")

    titulo, conteudo = peca.get("titulo", "Documento"), peca["conteudo"]
    filename = f"{titulo.replace(' ', '_')}.{format}"
    
    if format == "pdf":
        buffer = markdown_to_pdf(conteudo, titulo=titulo, workspace_name=workspace_name)
        media = "application/pdf"
    else:
        buffer = markdown_to_docx(conteudo, titulo=titulo, workspace_name=workspace_name)
        media = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return StreamingResponse(buffer, media_type=media, headers={"Content-Disposition": f"attachment; filename*=UTF-8''{urllib.parse.quote(filename)}"})


@router.get("/{peca_id}/gdocs-url")
async def get_gdocs_url(peca_id: str, current_user: dict = Depends(get_current_user)):
    if not await peca_service.get_peca(get_database(), peca_id, current_user["_workspace_id"]):
        raise HTTPException(status_code=404, detail="Peça não encontrada.")
    return {"download_url": f"/pecas/{peca_id}/download", "message": "Baixe o .docx para abrir no Google Docs."}


@router.post("/{peca_id}/request-signature", response_model=PecaResponse)
async def request_signature(peca_id: str, request: PecaSignatureRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    updated = await peca_service.request_signature(db, peca_id, current_user["_workspace_id"], request.model_dump()["signers"])
    if not updated: raise HTTPException(status_code=404, detail="Peça não encontrada.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "SIGNATURE_REQUEST", "peca", resource_id=peca_id, details=f"Sent to {len(request.signers)} signers")
    return PecaResponse(**updated)
