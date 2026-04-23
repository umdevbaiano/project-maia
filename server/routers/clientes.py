from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware import get_current_user, require_roles
from models.user import UserRole
from services import cliente_service, audit_service
from models.cliente import ClienteCreateRequest, ClienteUpdateRequest, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.post("/", response_model=ClienteResponse)
async def create_cliente(request: ClienteCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await cliente_service.create_cliente(db, request.model_dump(), current_user["_workspace_id"])
    await audit_service.log_action(
        db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""),
        "CREATE", "cliente", resource_id=result.get("id", ""), details=f"Cliente: {request.nome}"
    )
    return result


@router.get("/")
async def list_clientes(search: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    db = get_database()
    return {"clientes": await cliente_service.list_clientes(db, current_user["_workspace_id"], search)}


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
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "UPDATE", "cliente", resource_id=cliente_id)
    return cliente


@router.get("/{cliente_id}/report")
async def get_cliente_report_endpoint(cliente_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    report = await cliente_service.get_cliente_report(db, cliente_id, current_user["_workspace_id"])
    if not report:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return report


@router.delete("/{cliente_id}")
async def delete_cliente(cliente_id: str, current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO))):
    db = get_database()
    if not await cliente_service.delete_cliente(db, cliente_id, current_user["_workspace_id"]):
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "DELETE", "cliente", resource_id=cliente_id)
    return {"message": "Cliente removido com sucesso."}
