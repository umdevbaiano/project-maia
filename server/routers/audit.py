from typing import Optional
from fastapi import APIRouter, Depends, Query
from database import get_database
from services import audit_service
from middleware import require_roles
from models.user import UserRole
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/audit", tags=["audit"])

class FineTuningFeedback(BaseModel):
    entrada_rag: str
    saida_ia: str
    modificacao_humana: str

@router.post("/fine-tuning-catch")
async def register_fine_tuning_feedback(feedback: FineTuningFeedback, current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO, "ADVOGADO"))):
    db, workspace_id = get_database(), current_user["_workspace_id"]
    await db["ml_fine_tuning_lake"].insert_one({
        "workspace_id": workspace_id,
        "user_id": current_user["_user_id"],
        "timestamp": datetime.now(timezone.utc),
        "entrada_rag": feedback.entrada_rag,
        "saida_ia_original": feedback.saida_ia,
        "modificacao_humana": feedback.modificacao_humana,
        "is_processed_for_ml": False
    })
    return {"status": "success", "message": "Feedback captured."}


@router.get("/logs")
async def list_audit_logs(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO)),
):
    return await audit_service.get_audit_logs(
        get_database(), current_user["_workspace_id"],
        action=action, resource_type=resource_type, user_id=user_id,
        date_from=date_from, date_to=date_to, page=page, per_page=per_page
    )
