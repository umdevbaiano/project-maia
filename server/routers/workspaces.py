from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import get_database
from middleware import get_current_user
from services import cliente_service, caso_service, prazo_service, audit_service
from services.auth_service import WORKSPACES_COLLECTION
from services.saas_service import get_workspace_usage
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("/sample-data")
async def generate_sample_data(current_user: dict = Depends(get_current_user)):
    if current_user["_role"] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem gerar dados de exemplo.")

    db, ws_id, u_id = get_database(), current_user["_workspace_id"], current_user["_user_id"]

    cliente = await cliente_service.create_cliente(db, ws_id, {
        "nome": "João da Silva (Exemplo)",
        "documento": "123.456.789-00",
        "email": "joao.exemplo@email.com",
        "telefone": "(11) 99999-9999",
        "tipo": "fisica"
    })
    
    caso = await caso_service.create_caso(db, ws_id, {
        "titulo": "Ação Trabalhista - Horas Extras (Exemplo)",
        "numero": "0001234-56.2023.5.02.0000",
        "area": "Trabalhista",
        "status": "ativo",
        "cliente_id": cliente["id"],
        "descricao": "Caso gerado automaticamente para demonstração."
    })
    
    await prazo_service.create_prazo(db, ws_id, u_id, {
        "titulo": "Apresentar Contestação (Exemplo)",
        "descricao": "Prazo de 15 dias.",
        "data_vencimento": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
        "caso_id": str(caso["_id"]) if "_id" in caso else caso["id"],
        "status": "pendente",
        "prioridade": "alta"
    })

    await audit_service.log_action(db, ws_id, u_id, current_user.get("email", ""), "CREATE", "workspace", resource_id=ws_id, details="Sample data generated")
    return {"message": "Dados de exemplo gerados."}


@router.put("/onboarding/complete")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    if current_user["_role"] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem concluir.")

    db, ws_id = get_database(), current_user["_workspace_id"]
    if (await db[WORKSPACES_COLLECTION].update_one({"_id": ObjectId(ws_id)}, {"$set": {"onboarding_completed": True}})).matched_count == 0:
        raise HTTPException(status_code=404, detail="Workspace não encontrado.")

    await audit_service.log_action(db, ws_id, current_user["_user_id"], current_user.get("email", ""), "UPDATE", "workspace", resource_id=ws_id, details="Onboarding completed")
    return {"message": "Onboarding concluído.", "onboarding_completed": True}


@router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    try:
        return {"usage": await get_workspace_usage(get_database(), current_user["_workspace_id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

