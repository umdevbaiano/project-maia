"""
Maia Platform — Documents Router
Endpoints for document upload, listing, and deletion.
All protected by JWT, scoped to workspace.
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional

from database import get_database
from middleware import get_current_user
from services import document_service, audit_service
from models.document import DocumentUploadResponse

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    cliente_id: Optional[str] = Form(None),
    caso_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a document for RAG indexing (RF-25, RF-27).
    Supports: PDF, TXT, DOCX. Max 10MB.
    """
    # Validate file extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato não suportado: .{ext}. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Arquivo muito grande. Máximo: 10MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    try:
        db = get_database()
        result = await document_service.process_document(
            db=db,
            file_bytes=file_bytes,
            filename=file.filename or "unknown",
            workspace_id=current_user["_workspace_id"],
            user_id=current_user["_user_id"],
            cliente_id=cliente_id,
            caso_id=caso_id,
        )
        await audit_service.log_action(
            db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
            user_email=current_user.get("email", ""), action="UPLOAD", resource_type="documento",
            resource_id=result.get("id", ""), details=f"Arquivo: {file.filename}",
        )
        return DocumentUploadResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar documento: {str(e)}")


@router.get("/")
async def list_documents(current_user: dict = Depends(get_current_user)):
    """List all documents for the current workspace (RF-28)."""
    try:
        db = get_database()
        documents = await document_service.list_documents(
            db, current_user["_workspace_id"]
        )
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar documentos: {str(e)}")


from pydantic import BaseModel

class LinkDocumentRequest(BaseModel):
    cliente_id: Optional[str] = None
    caso_id: Optional[str] = None

@router.put("/{doc_id}/link")
async def link_document(
    doc_id: str,
    request: LinkDocumentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Link an existing document to a client or case."""
    try:
        db = get_database()
        result = await document_service.link_document(
            db, doc_id, current_user["_workspace_id"], request.cliente_id, request.caso_id
        )
        await audit_service.log_action(
            db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
            user_email=current_user.get("email", ""), action="UPDATE", resource_type="documento",
            resource_id=doc_id, details=f"Vinculado a Cliente/Caso"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao vincular documento: {str(e)}")


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a document and its chunks from the index (RF-29)."""
    try:
        db = get_database()
        result = await document_service.delete_document(
            db, doc_id, current_user["_workspace_id"]
        )
        await audit_service.log_action(
            db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
            user_email=current_user.get("email", ""), action="DELETE", resource_type="documento",
            resource_id=doc_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar documento: {str(e)}")
