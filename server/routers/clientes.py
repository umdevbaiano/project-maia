"""
Maia Platform — Clients Router
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from database import get_database
from middleware import get_current_user
from services import cliente_service
from models.cliente import ClienteCreateRequest, ClienteUpdateRequest, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.post("/", response_model=ClienteResponse)
async def create_cliente(request: ClienteCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    return await cliente_service.create_cliente(db, request.model_dump(), current_user["_workspace_id"])


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
    return cliente


@router.delete("/{cliente_id}")
async def delete_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    deleted = await cliente_service.delete_cliente(db, cliente_id, current_user["_workspace_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return {"message": "Cliente removido com sucesso."}
