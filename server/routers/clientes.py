"""
Maia Platform — Clients Router
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from database import get_database
from middleware import get_current_user
from services import cliente_service, audit_service
from models.cliente import ClienteCreateRequest, ClienteUpdateRequest, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.post("/", response_model=ClienteResponse)
async def create_cliente(request: ClienteCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await cliente_service.create_cliente(db, request.model_dump(), current_user["_workspace_id"])
    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="CREATE", resource_type="cliente",
        resource_id=result.get("id", ""), details=f"Cliente: {request.nome}",
    )
    return result


@router.get("/")
async def list_clientes(
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    clientes = await cliente_service.list_clientes(db, current_user["_workspace_id"], search)
    return {"clientes": clientes}


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    cliente = await cliente_service.get_cliente(db, cliente_id, current_user["_workspace_id"])
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(cliente_id: str, request: ClienteUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    cliente = await cliente_service.update_cliente(db, cliente_id, current_user["_workspace_id"], request.model_dump())
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="UPDATE", resource_type="cliente",
        resource_id=cliente_id,
    )
    return cliente


@router.delete("/{cliente_id}")
async def delete_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    deleted = await cliente_service.delete_cliente(db, cliente_id, current_user["_workspace_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="DELETE", resource_type="cliente",
        resource_id=cliente_id,
    )
    return {"message": "Cliente removido com sucesso."}
