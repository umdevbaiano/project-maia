from fastapi import APIRouter, HTTPException, Depends
from database import get_database
from services import auth_service, audit_service
from models.user import (
    RegisterWorkspaceRequest, LoginRequest, InviteRequest,
    AcceptInviteRequest, TokenResponse, UserResponse,
    UserRole, VerifyRegistrationRequest,
)
from middleware import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register_workspace(request: RegisterWorkspaceRequest):
    try:
        db = get_database()
        return await auth_service.request_registration_code(db, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao solicitar registro: {e}")


@router.post("/register/verify", response_model=TokenResponse)
async def verify_registration(request: VerifyRegistrationRequest):
    try:
        db = get_database()
        result = await auth_service.register_workspace(db, request.email, request.code)
        await audit_service.log_action(
            db, result.user.workspace_id, result.user.id, request.email,
            "REGISTER", "auth", details=f"Workspace: {result.user.workspace_name}"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao verificar registro: {e}")


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    try:
        db = get_database()
        result = await auth_service.login(db, request)
        await audit_service.log_action(
            db,
            result.user.workspace_id if hasattr(result, "user") else "",
            result.user.id if hasattr(result, "user") else "",
            request.email, "LOGIN", "auth"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer login: {e}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
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
    try:
        db = get_database()
        result = await auth_service.invite_user(db, request, current_user["_workspace_id"])
        await audit_service.log_action(
            db, current_user["_workspace_id"], current_user["_user_id"],
            current_user.get("email", ""), "INVITE", "auth",
            details=f"Convidado: {request.email} ({request.role})"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/accept-invite", response_model=TokenResponse)
async def accept_invite(request: AcceptInviteRequest):
    try:
        db = get_database()
        return await auth_service.accept_invite(db, request.token, request.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/workspace/members", response_model=list[UserResponse])
async def get_workspace_members(current_user: dict = Depends(get_current_user)):
    try:
        db = get_database()
        members = await db["users"].find({"workspace_id": current_user["_workspace_id"]}).to_list(100)
        
        enriched = []
        for m in members:
            profile = await auth_service.get_user_profile(db, str(m["_id"]))
            if profile: enriched.append(profile)
        return enriched
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/revoke")
async def revoke_user(
    user_id: str,
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO)),
):
    try:
        db = get_database()
        result = await auth_service.revoke_user(db, user_id, current_user["_workspace_id"])
        await audit_service.log_action(
            db, current_user["_workspace_id"], current_user["_user_id"],
            current_user.get("email", ""), "REVOKE", "auth", resource_id=user_id, details="Acesso revogado"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
