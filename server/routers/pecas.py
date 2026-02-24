"""
Maia Platform — Peças Jurídicas Router
Endpoints for AI-powered legal document generation.
"""
import urllib.parse

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from database import get_database
from middleware import get_current_user
from core.ai.factory import get_ai_provider
from core.documents.docx_generator import markdown_to_docx
from models.peca import PecaGenerateRequest, PecaResponse
from services import peca_service, audit_service

router = APIRouter(prefix="/pecas", tags=["pecas"])


@router.post("/generate", response_model=PecaResponse)
async def generate_peca(
    request: PecaGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a legal document using AI (RF-42)."""
    try:
        db = get_database()
        ai = get_ai_provider()
        result = await peca_service.generate_peca(
            db=db,
            ai_provider=ai,
            workspace_id=current_user["_workspace_id"],
            user_id=current_user["_user_id"],
            tipo=request.tipo,
            instrucoes=request.instrucoes,
            caso_id=request.caso_id,
        )
        await audit_service.log_action(
            db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
            user_email=current_user.get("email", ""), action="GENERATE", resource_type="peca",
            resource_id=result.get("id", ""), details=f"Tipo: {request.tipo}",
        )
        return PecaResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar peça: {str(e)}")


@router.get("/")
async def list_pecas(current_user: dict = Depends(get_current_user)):
    """List all generated legal documents for the workspace."""
    db = get_database()
    pecas = await peca_service.list_pecas(db, current_user["_workspace_id"])
    return {"pecas": pecas}


@router.get("/{peca_id}", response_model=PecaResponse)
async def get_peca(peca_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single legal document."""
    db = get_database()
    peca = await peca_service.get_peca(db, peca_id, current_user["_workspace_id"])
    if not peca:
        raise HTTPException(status_code=404, detail="Peça não encontrada.")
    return PecaResponse(**peca)


@router.delete("/{peca_id}")
async def delete_peca(peca_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a legal document."""
    db = get_database()
    deleted = await peca_service.delete_peca(db, peca_id, current_user["_workspace_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Peça não encontrada.")
    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="DELETE", resource_type="peca",
        resource_id=peca_id,
    )
    return {"message": "Peça removida com sucesso."}


@router.get("/{peca_id}/download")
async def download_peca_docx(peca_id: str, current_user: dict = Depends(get_current_user)):
    """Download a legal document as .docx."""
    db = get_database()
    peca = await peca_service.get_peca(db, peca_id, current_user["_workspace_id"])
    if not peca:
        raise HTTPException(status_code=404, detail="Peça não encontrada.")

    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="EXPORT", resource_type="peca",
        resource_id=peca_id, details="Download DOCX",
    )

    docx_buffer = markdown_to_docx(peca["conteudo"], titulo=peca.get("titulo", "Documento"))
    filename = f"{peca.get('titulo', 'peca').replace(' ', '_')}.docx"

    return StreamingResponse(
        docx_buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{peca_id}/gdocs-url")
async def get_gdocs_url(peca_id: str, current_user: dict = Depends(get_current_user)):
    """
    Return a URL that will open the peça content in Google Docs.
    Uses the Google Docs viewer with the download URL.
    """
    db = get_database()
    peca = await peca_service.get_peca(db, peca_id, current_user["_workspace_id"])
    if not peca:
        raise HTTPException(status_code=404, detail="Peça não encontrada.")

    # Build the download URL for the docx
    download_url = f"/pecas/{peca_id}/download"
    return {
        "download_url": download_url,
        "message": "Use o botão de download para baixar o .docx e abrir no Google Docs.",
    }
