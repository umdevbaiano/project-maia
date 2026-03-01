"""
Maia Platform — Auth Router
Public endpoints for authentication (no JWT required).
"""
from fastapi import APIRouter, HTTPException, Depends

from database import get_database
from services import auth_service, audit_service
from models.user import (
    RegisterWorkspaceRequest,
    LoginRequest,
    InviteRequest,
    AcceptInviteRequest,
    TokenResponse,
    UserResponse,
    UserRole,
    VerifyRegistrationRequest,
)
from middleware import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register_workspace(request: RegisterWorkspaceRequest):
    """Step 1: Request workspace registration and receive OTP via email."""
    try:
        db = get_database()
        result = await auth_service.request_registration_code(db, request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao solicitar registro: {str(e)}")


@router.post("/register/verify", response_model=TokenResponse)
async def verify_registration(request: VerifyRegistrationRequest):
    """Step 2: Verify OTP and complete registration (RF-01)."""
    try:
        db = get_database()
        result = await auth_service.register_workspace(db, request.email, request.code)
        # Audit: register
        await audit_service.log_action(
            db,
            workspace_id=result.user.workspace_id,
            user_id=result.user.id,
            user_email=request.email,
            action="REGISTER",
            resource_type="auth",
            details=f"Workspace: {result.user.workspace_name}",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao verificar registro: {str(e)}")


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with email and password (RF-02)."""
    try:
        db = get_database()
        result = await auth_service.login(db, request)
        # Audit: login
        await audit_service.log_action(
            db,
            workspace_id=result.user.workspace_id if hasattr(result, "user") else "",  # type: ignore
            user_id=result.user.id if hasattr(result, "user") else "",  # type: ignore
            user_email=request.email,
            action="LOGIN",
            resource_type="auth",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer login: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user profile."""
    db = get_database()
    profile = await auth_service.get_user_profile(db, current_user["_user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado.")
    return profile


@router.post("/invite")
async def invite_user(
    request: InviteRequest,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO)),
):
    """Invite a new user to the workspace (RF-04)."""
    try:
        db = get_database()
        result = await auth_service.invite_user(
            db, request, current_user["_workspace_id"]
        )
        await audit_service.log_action(
            db,
            workspace_id=current_user["_workspace_id"],
            user_id=current_user["_user_id"],
            user_email=current_user.get("email", ""),
            action="INVITE",
            resource_type="auth",
            details=f"Convidado: {request.email} ({request.role})",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/accept-invite", response_model=TokenResponse)
async def accept_invite(request: AcceptInviteRequest):
    """Accept an invite and create account."""
    try:
        db = get_database()
        result = await auth_service.accept_invite(db, request.token, request.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/users/{user_id}/revoke")
async def revoke_user(
    user_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN)),
):
    """Revoke a user's access (RF-08). Admin only."""
    try:
        db = get_database()
        result = await auth_service.revoke_user(
            db, user_id, current_user["_workspace_id"]
        )
        await audit_service.log_action(
            db,
            workspace_id=current_user["_workspace_id"],
            user_id=current_user["_user_id"],
            user_email=current_user.get("email", ""),
            action="REVOKE",
            resource_type="auth",
            resource_id=user_id,
            details="Acesso revogado",
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
