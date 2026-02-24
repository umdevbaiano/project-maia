"""
Maia Platform — Deadlines Router
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from database import get_database
from middleware import get_current_user
from services import prazo_service
from models.prazo import PrazoCreateRequest, PrazoUpdateRequest, PrazoResponse

router = APIRouter(prefix="/prazos", tags=["prazos"])


@router.post("/", response_model=PrazoResponse)
async def create_prazo(request: PrazoCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    return await prazo_service.create_prazo(
        db, request.model_dump(), current_user["_workspace_id"], current_user["_user_id"]
    )


@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    """Dashboard alerts: overdue + upcoming 7 days (RF-32)."""
    db = get_database()
    return await prazo_service.get_dashboard_alerts(db, current_user["_workspace_id"])


@router.get("/")
async def list_prazos(
    status: Optional[str] = Query(None),
    caso_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    prazos = await prazo_service.list_prazos(db, current_user["_workspace_id"], status, caso_id)
    return {"prazos": prazos}


@router.get("/{prazo_id}", response_model=PrazoResponse)
async def get_prazo(prazo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    prazo = await prazo_service.get_prazo(db, prazo_id, current_user["_workspace_id"])
    if not prazo:
        raise HTTPException(status_code=404, detail="Prazo não encontrado.")
    return prazo


@router.put("/{prazo_id}", response_model=PrazoResponse)
async def update_prazo(prazo_id: str, request: PrazoUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    prazo = await prazo_service.update_prazo(db, prazo_id, current_user["_workspace_id"], request.model_dump())
    if not prazo:
        raise HTTPException(status_code=404, detail="Prazo não encontrado.")
    return prazo


@router.delete("/{prazo_id}")
async def delete_prazo(prazo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    deleted = await prazo_service.delete_prazo(db, prazo_id, current_user["_workspace_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Prazo não encontrado.")
    return {"message": "Prazo removido com sucesso."}
