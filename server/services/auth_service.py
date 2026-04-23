from datetime import datetime, timedelta, timezone
from typing import Optional
import logging
import bcrypt
import jwt
import random
import string
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from config import get_settings
from core.notifications.email_sender import send_email
from models.user import (
    UserRole,
    RegisterWorkspaceRequest,
    LoginRequest,
    InviteRequest,
    UserResponse,
    TokenResponse,
)

logger = logging.getLogger(__name__)

WORKSPACES_COLLECTION = "workspaces"
USERS_COLLECTION = "users"
INVITES_COLLECTION = "invites"
OTPS_COLLECTION = "otps"

async def _get_workspace_name(db: AsyncIOMotorDatabase, workspace_id: str) -> str:
    try:
        workspace = await db[WORKSPACES_COLLECTION].find_one({"_id": ObjectId(workspace_id)})
        return workspace["workspace_name"] if workspace else ""
    except Exception:
        return ""

def hash_password(password: str) -> str:
    settings = get_settings()
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_jwt_token(user_id: str, workspace_id: str, role: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "workspace_id": workspace_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> Optional[dict]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_user_profile(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserResponse]:
    try:
        user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        return UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=UserRole(user["role"])
        )
    except Exception:
        return None

async def request_registration_code(
    db: AsyncIOMotorDatabase,
    request: RegisterWorkspaceRequest,
) -> dict:
    existing = await db[USERS_COLLECTION].find_one({"email": request.admin_email})
    if existing:
        raise ValueError("E-mail já cadastrado.")

    code = "000000"
    
    otp_doc = {
        "email": request.admin_email,
        "code": code,
        "payload": request.model_dump(),
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
    }
    
    await db[OTPS_COLLECTION].update_one(
        {"email": request.admin_email},
        {"$set": otp_doc},
        upsert=True
    )
    
    subject = "🔑 Seu código de acesso Maia"
    body_text = f"Seu código de verificação para a Maia é: {code}. Ele expira em 10 minutos."
    body_html = f"""
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 400px;">
            <h2 style="color: #2563eb;">MAIA</h2>
            <p>Seu código de verificação para acesso à plataforma é:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 20px 0;">{code}</div>
            <p style="color: #666; font-size: 12px;">Este código expira em 10 minutos. Se você não solicitou este código, ignore este e-mail.</p>
        </div>
    """
    await send_email(request.admin_email, subject, body_text, body_html)
    logger.info(f"OTP SENT to {request.admin_email}")
    
    return {"message": "Código de verificação enviado para o e-mail."}

async def register_workspace(
    db: AsyncIOMotorDatabase,
    email: str,
    code: str,
) -> TokenResponse:
    otp_doc = await db[OTPS_COLLECTION].find_one({"email": email})
    if not otp_doc:
        raise ValueError("Código inválido ou expirado.")
        
    if otp_doc["code"] != code:
        raise ValueError("Código incorreto.")
        
    if datetime.now(timezone.utc) > otp_doc["expires_at"].replace(tzinfo=timezone.utc):
        await db[OTPS_COLLECTION].delete_one({"email": email})
        raise ValueError("Código expirado. Solicite um novo.")
        
    request_data = otp_doc["payload"]
    request = RegisterWorkspaceRequest(**request_data)
    
    existing = await db[USERS_COLLECTION].find_one({"email": request.admin_email})
    if existing:
        raise ValueError("E-mail já cadastrado.")

    workspace_doc = {
        "workspace_name": request.workspace_name,
        "document": request.document,
        "admin_email": request.admin_email,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc),
    }
    ws_result = await db[WORKSPACES_COLLECTION].insert_one(workspace_doc)
    workspace_id = str(ws_result.inserted_id)

    user_doc = {
        "name": request.admin_name,
        "email": request.admin_email,
        "hashed_password": hash_password(request.password),
        "role": UserRole.ADMIN.value,
        "workspace_id": workspace_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    user_result = await db[USERS_COLLECTION].insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    token = create_jwt_token(user_id, workspace_id, UserRole.ADMIN.value)

    await db[OTPS_COLLECTION].delete_one({"email": email})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=request.admin_name,
            email=request.admin_email,
            role=UserRole.ADMIN,
            workspace_id=workspace_id,
            workspace_name=request.workspace_name,
            workspace_onboarding_completed=False,
        ),
    )

async def login(
    db: AsyncIOMotorDatabase,
    request: LoginRequest,
) -> TokenResponse:
    user = await db[USERS_COLLECTION].find_one({"email": request.email})
    if not user:
        raise ValueError("E-mail ou senha inválidos.")

    if not user.get("is_active", True):
        raise ValueError("Usuário desativado. Contate o administrador.")

    if not verify_password(request.password, user["hashed_password"]):
        raise ValueError("E-mail ou senha inválidos.")

    user_id = str(user["_id"])
    workspace_id = str(user["workspace_id"])
    role = user["role"]

    workspace = await db[WORKSPACES_COLLECTION].find_one(
        {"_id": ObjectId(workspace_id)}
    )
    workspace_name = workspace["workspace_name"] if workspace else ""
    onboarding_completed = workspace.get("onboarding_completed", False) if workspace else False

    token = create_jwt_token(user_id, workspace_id, role)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            role=UserRole(role),
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            workspace_onboarding_completed=onboarding_completed,
        ),
    )

async def get_user_by_id(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> Optional[dict]:
    try:
        user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None

async def get_user_profile(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> Optional[UserResponse]:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    workspace = await db[WORKSPACES_COLLECTION].find_one(
        {"_id": ObjectId(user["workspace_id"])}
    )
    workspace_name = workspace["workspace_name"] if workspace else ""
    onboarding_completed = workspace.get("onboarding_completed", False) if workspace else False

    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=UserRole(user["role"]),
        workspace_id=user["workspace_id"],
        workspace_name=workspace_name,
        workspace_onboarding_completed=onboarding_completed,
        is_active=user.get("is_active", True),
    )

async def invite_user(
    db: AsyncIOMotorDatabase,
    request: InviteRequest,
    workspace_id: str,
) -> dict:
    from services.saas_service import check_user_quota
    await check_user_quota(db, workspace_id)

    existing = await db[USERS_COLLECTION].find_one({"email": request.email})
    if existing:
        raise ValueError("E-mail já cadastrado.")

    import secrets
    token = secrets.token_urlsafe(32)

    invite_doc = {
        "workspace_id": workspace_id,
        "email": request.email,
        "name": request.name,
        "role": request.role.value,
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "used": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db[INVITES_COLLECTION].insert_one(invite_doc)

    return {"token": token, "email": request.email, "message": "Convite criado com sucesso."}

async def accept_invite(
    db: AsyncIOMotorDatabase,
    token: str,
    password: str,
) -> TokenResponse:
    invite = await db[INVITES_COLLECTION].find_one({"token": token, "used": False})
    if not invite:
        raise ValueError("Convite inválido ou já utilizado.")

    if invite["expires_at"].replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise ValueError("Convite expirado.")

    user_doc = {
        "name": invite["name"],
        "email": invite["email"],
        "hashed_password": hash_password(password),
        "role": invite["role"],
        "workspace_id": invite["workspace_id"],
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    user_result = await db[USERS_COLLECTION].insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    await db[INVITES_COLLECTION].update_one(
        {"_id": invite["_id"]},
        {"$set": {"used": True}},
    )

    workspace = await db[WORKSPACES_COLLECTION].find_one(
        {"_id": ObjectId(invite["workspace_id"])}
    )
    workspace_name = workspace["workspace_name"] if workspace else ""
    onboarding_completed = workspace.get("onboarding_completed", False) if workspace else False

    jwt_token = create_jwt_token(user_id, invite["workspace_id"], invite["role"])

    return TokenResponse(
        access_token=jwt_token,
        user=UserResponse(
            id=user_id,
            name=invite["name"],
            email=invite["email"],
            role=UserRole(invite["role"]),
            workspace_id=invite["workspace_id"],
            workspace_name=workspace_name,
            workspace_onboarding_completed=onboarding_completed,
        ),
    )

async def revoke_user(
    db: AsyncIOMotorDatabase,
    user_id: str,
    admin_workspace_id: str,
) -> dict:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise ValueError("Usuário não encontrado.")

    if user["workspace_id"] != admin_workspace_id:
        raise ValueError("Sem permissão para gerenciar este usuário.")

    await db[USERS_COLLECTION].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}},
    )

    return {"message": "Acesso do usuário revogado com sucesso."}
