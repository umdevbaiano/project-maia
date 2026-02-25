"""
Maia Platform — Cases Router
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from database import get_database
from middleware import get_current_user, require_roles
from models.user import UserRole
from services import caso_service, audit_service
from models.caso import CasoCreateRequest, CasoUpdateRequest, CasoResponse
from core.legal.datajud import lookup_case

router = APIRouter(prefix="/casos", tags=["casos"])


@router.post("/", response_model=CasoResponse)
async def create_caso(request: CasoCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await caso_service.create_caso(
        db, request.model_dump(), current_user["_workspace_id"], current_user["_user_id"]
    )

    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="CREATE", resource_type="caso",
        resource_id=result.get("id", ""), details=f"Caso: {request.titulo}",
    )

    # Auto-enrich with Datajud data on creation
    if request.numero:
        try:
            tribunal_data = await lookup_case(request.numero)
            if tribunal_data:
                enrichment = {
                    "classe_processual": tribunal_data.get("classe", ""),
                    "orgao_julgador": tribunal_data.get("orgao_julgador", ""),
                    "data_ajuizamento": tribunal_data.get("data_ajuizamento", ""),
                    "assuntos": tribunal_data.get("assuntos", []),
                    "dados_tribunal": tribunal_data,
                }
                if tribunal_data.get("tribunal"):
                    enrichment["tribunal"] = tribunal_data["tribunal"]
                if tribunal_data.get("orgao_julgador"):
                    enrichment["vara"] = tribunal_data["orgao_julgador"]
                await caso_service.update_caso(
                    db, result["id"], current_user["_workspace_id"], enrichment
                )
                result.update(enrichment)
        except Exception as e:
            print(f"Auto-enrichment failed (non-blocking): {e}")

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
    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="UPDATE", resource_type="caso",
        resource_id=caso_id,
    )
    return caso


@router.delete("/{caso_id}")
async def delete_caso(
    caso_id: str, 
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO))
):
    db = get_database()
    deleted = await caso_service.delete_caso(db, caso_id, current_user["_workspace_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")
    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="DELETE", resource_type="caso",
        resource_id=caso_id,
    )
    return {"message": "Processo removido com sucesso."}


@router.post("/{caso_id}/sync")
async def sync_caso_tribunal(caso_id: str, current_user: dict = Depends(get_current_user)):
    """Re-query Datajud and update case with latest court data."""
    db = get_database()
    caso = await caso_service.get_caso(db, caso_id, current_user["_workspace_id"])
    if not caso:
        raise HTTPException(status_code=404, detail="Processo não encontrado.")

    numero = caso.get("numero", "")
    if not numero:
        raise HTTPException(status_code=400, detail="Processo sem número cadastrado.")

    tribunal_data = await lookup_case(numero)
    if not tribunal_data:
        raise HTTPException(status_code=404, detail="Processo não encontrado no Datajud/CNJ.")

    enrichment = {
        "classe_processual": tribunal_data.get("classe", ""),
        "orgao_julgador": tribunal_data.get("orgao_julgador", ""),
        "data_ajuizamento": tribunal_data.get("data_ajuizamento", ""),
        "assuntos": tribunal_data.get("assuntos", []),
        "dados_tribunal": tribunal_data,
    }
    if tribunal_data.get("tribunal"):
        enrichment["tribunal"] = tribunal_data["tribunal"]
    if tribunal_data.get("orgao_julgador"):
        enrichment["vara"] = tribunal_data["orgao_julgador"]

    updated = await caso_service.update_caso(
        db, caso_id, current_user["_workspace_id"], enrichment
    )
    if not updated:
        raise HTTPException(status_code=500, detail="Erro ao atualizar processo.")

    await audit_service.log_action(
        db, workspace_id=current_user["_workspace_id"], user_id=current_user["_user_id"],
        user_email=current_user.get("email", ""), action="SYNC", resource_type="caso",
        resource_id=caso_id, details=f"Datajud sync: {numero}",
    )

    return {
        "message": "Processo atualizado com dados do tribunal.",
        "dados_tribunal": tribunal_data,
    }
