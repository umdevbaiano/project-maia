from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_database
from middleware import get_current_user, require_roles
from models.user import UserRole
from services import caso_service, audit_service
from models.caso import CasoCreateRequest, CasoUpdateRequest, CasoResponse
from core.legal.datajud import lookup_case
from core.ai.factory import get_ai_provider

router = APIRouter(prefix="/casos", tags=["casos"])


@router.post("/", response_model=CasoResponse)
async def create_caso(request: CasoCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await caso_service.create_caso(db, request.model_dump(), current_user["_workspace_id"], current_user["_user_id"])

    await audit_service.log_action(
        db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""),
        "CREATE", "caso", resource_id=result.get("id", ""), details=f"Caso: {request.titulo}"
    )

    if request.numero:
        try:
            data = await lookup_case(request.numero)
            if data:
                enrich = {
                    "classe_processual": data.get("classe", ""),
                    "orgao_julgador": data.get("orgao_julgador", ""),
                    "data_ajuizamento": data.get("data_ajuizamento", ""),
                    "assuntos": data.get("assuntos", []),
                    "dados_tribunal": data,
                    "tribunal": data.get("tribunal"),
                    "vara": data.get("orgao_julgador")
                }
                await caso_service.update_caso(db, result["id"], current_user["_workspace_id"], {k: v for k, v in enrich.items() if v is not None})
                result.update(enrich)
        except Exception as e:
            print(f"Auto-enrichment failed: {e}")

    return result


@router.get("/")
async def list_casos(status: Optional[str] = Query(None), tipo: Optional[str] = Query(None), search: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    db = get_database()
    return {"casos": await caso_service.list_casos(db, current_user["_workspace_id"], status, tipo, search)}


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
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "UPDATE", "caso", resource_id=caso_id)
    return caso


@router.delete("/{caso_id}")
async def delete_caso(caso_id: str, current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO))):
    db = get_database()
    if not await caso_service.delete_caso(db, caso_id, current_user["_workspace_id"]):
        raise HTTPException(status_code=404, detail="Processo não encontrado.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "DELETE", "caso", resource_id=caso_id)
    return {"message": "Processo removido com sucesso."}


@router.post("/{caso_id}/sync")
async def sync_caso_tribunal(caso_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    caso = await caso_service.get_caso(db, caso_id, current_user["_workspace_id"])
    if not caso or not caso.get("numero"):
        raise HTTPException(status_code=400, detail="Processo inválido para sincronização.")

    data = await lookup_case(caso["numero"])
    if not data:
        raise HTTPException(status_code=404, detail="Dados não encontrados no tribunal.")

    enrich = {
        "classe_processual": data.get("classe", ""),
        "orgao_julgador": data.get("orgao_julgador", ""),
        "data_ajuizamento": data.get("data_ajuizamento", ""),
        "assuntos": data.get("assuntos", []),
        "dados_tribunal": data,
        "tribunal": data.get("tribunal"),
        "vara": data.get("orgao_julgador")
    }

    if not await caso_service.update_caso(db, caso_id, current_user["_workspace_id"], {k: v for k, v in enrich.items() if v is not None}):
        raise HTTPException(status_code=500, detail="Erro ao atualizar processo.")

    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "SYNC", "caso", resource_id=caso_id)
    return {"message": "Processo atualizado.", "dados_tribunal": data}


@router.post("/{caso_id}/analyze")
async def analyze_caso(caso_id: str, current_user: dict = Depends(get_current_user)):
    db, ai = get_database(), get_ai_provider()
    analytics = await caso_service.generate_case_analytics(db, ai, caso_id, current_user["_workspace_id"])
    if not analytics:
        raise HTTPException(status_code=500, detail="Erro ao gerar análise.")
    await audit_service.log_action(db, current_user["_workspace_id"], current_user["_user_id"], current_user.get("email", ""), "ANALYZE", "caso", resource_id=caso_id)
    return analytics
