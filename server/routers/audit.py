"""
Maia Platform — Audit Router
Read-only endpoints for audit log queries. Restricted to ADMIN / SOCIO roles.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query

from database import get_database
from services import audit_service
from middleware import require_roles
from models.user import UserRole

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    date_from: Optional[str] = Query(None, description="Start date (ISO 8601)"),
    date_to: Optional[str] = Query(None, description="End date (ISO 8601)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO)),
):
    """List audit logs with optional filters. Admin/Sócio only."""
    db = get_database()
    workspace_id = current_user["_workspace_id"]
    result = await audit_service.get_audit_logs(
        db, workspace_id,
        action=action,
        resource_type=resource_type,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )
    return result
