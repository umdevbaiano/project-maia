from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from typing import Optional
from pydantic import BaseModel
from database import get_database
from middleware import get_current_user
from services import document_service, audit_service
from models.document import DocumentUploadResponse

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), cliente_id: Optional[str] = Form(None), caso_id: Optional[str] = Form(None), current_user: dict = Depends(get_current_user)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Formato .{ext} não suportado. Use: {ALLOWED_EXTENSIONS}")

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo inválido ou muito grande (máx 10MB).")

    try:
        db = get_database()
        result = await document_service.process_document(db, background_tasks, file_bytes, file.filename or "unknown", current_user["_workspace_id"], current_user["_user_id"], cliente_id, caso_id)
        await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "UPLOAD", "documento", resource_id=result.get("id", ""), details=f"Arquivo: {file.filename}")
        return DocumentUploadResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar: {e}")


@router.get("/")
async def list_documents(current_user: dict = Depends(get_current_user)):
    try:
        return {"documents": await document_service.list_documents(get_database(), current_user["_workspace_id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar: {e}")


class LinkDocumentRequest(BaseModel):
    cliente_id: Optional[str] = None
    caso_id: Optional[str] = None


@router.put("/{doc_id}/link")
async def link_document(doc_id: str, request: LinkDocumentRequest, current_user: dict = Depends(get_current_user)):
    try:
        db = get_database()
        result = await document_service.link_document(db, doc_id, current_user["_workspace_id"], request.cliente_id, request.caso_id)
        await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "UPDATE", "documento", resource_id=doc_id, details="Vínculo alterado")
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao vincular: {e}")


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    try:
        db = get_database()
        result = await document_service.delete_document(db, doc_id, current_user["_workspace_id"])
        await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "DELETE", "documento", resource_id=doc_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar: {e}")
