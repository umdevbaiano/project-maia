"""
Maia Platform — Cases Router
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from database import get_database
from middleware import get_current_user
from services import caso_service
from models.caso import CasoCreateRequest, CasoUpdateRequest, CasoResponse

router = APIRouter(prefix="/casos", tags=["casos"])


@router.post("/", response_model=CasoResponse)
async def create_caso(request: CasoCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await caso_service.create_caso(
        db, request.model_dump(), current_user["_workspace_id"], current_user["_user_id"]
    )
    return result


@router.get("/")
async def list_casos(
    status: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    casos = await caso_service.list_casos(db, current_user["_workspace_id"], status, tipo, search)
    return {"casos": casos}


@router.get("/{caso_id}", response_model=CasoResponse)
async def get_caso(caso_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    caso = await caso_service.get_caso(db, caso_id, current_user["_workspace_id"])
    if not caso:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")
    return caso


@router.put("/{caso_id}", response_model=CasoResponse)
async def update_caso(caso_id: str, request: CasoUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    caso = await caso_service.update_caso(db, caso_id, current_user["_workspace_id"], request.model_dump())
    if not caso:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")
    return caso


@router.delete("/{caso_id}")
async def delete_caso(caso_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    deleted = await caso_service.delete_caso(db, caso_id, current_user["_workspace_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")
    return {"message": "Processo removido com sucesso."}
