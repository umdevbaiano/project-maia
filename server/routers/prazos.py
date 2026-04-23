from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware import get_current_user
from services import prazo_service, audit_service
from models.prazo import PrazoCreateRequest, PrazoUpdateRequest, PrazoResponse

router = APIRouter(prefix="/prazos", tags=["prazos"])


@router.post("/", response_model=PrazoResponse)
async def create_prazo(request: PrazoCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await prazo_service.create_prazo(db, request.model_dump(), current_user["_workspace_id"], current_user["_user_id"])
    await audit_service.log_action(
        db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""),
        "CREATE", "prazo", resource_id=result.get("id", ""), details=f"Prazo: {request.titulo}"
    )
    return result


@router.get("/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    return await prazo_service.get_dashboard_alerts(get_database(), current_user["_workspace_id"])


@router.get("/")
async def list_prazos(status: Optional[str] = Query(None), caso_id: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    db = get_database()
    return {"prazos": await prazo_service.list_prazos(db, current_user["_workspace_id"], status, caso_id)}


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
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "UPDATE", "prazo", resource_id=prazo_id)
    return prazo


@router.delete("/{prazo_id}")
async def delete_prazo(prazo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if not await prazo_service.delete_prazo(db, prazo_id, current_user["_workspace_id"]):
        raise HTTPException(status_code=404, detail="Prazo não encontrado.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "DELETE", "prazo", resource_id=prazo_id)
    return {"message": "Prazo removido com sucesso."}
