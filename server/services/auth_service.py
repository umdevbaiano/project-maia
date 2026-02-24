"""
Maia Platform — Auth Service
Business logic for authentication, JWT, and user management (RNF-10).
"""
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from config import get_settings
from models.user import (
    UserRole,
    RegisterWorkspaceRequest,
    LoginRequest,
    InviteRequest,
    UserResponse,
    TokenResponse,
)

WORKSPACES_COLLECTION = "workspaces"
USERS_COLLECTION = "users"
INVITES_COLLECTION = "invites"


# --- Password Helpers ---

def hash_password(password: str) -> str:
    """Hash password with bcrypt (cost 12, RNF-05)."""
    settings = get_settings()
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# --- JWT Helpers ---

def create_jwt_token(user_id: str, workspace_id: str, role: str) -> str:
    """Create a JWT token with user claims."""
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
    """Verify and decode a JWT token. Returns None if invalid."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# --- Registration ---

async def register_workspace(
    db: AsyncIOMotorDatabase,
    request: RegisterWorkspaceRequest,
) -> TokenResponse:
    """
    Register a new workspace with an admin user (RF-01).
    Returns a JWT token for immediate login.
    """
    # Check if email already exists
    existing = await db[USERS_COLLECTION].find_one({"email": request.admin_email})
    if existing:
        raise ValueError("E-mail já cadastrado.")

    # Create workspace
    workspace_doc = {
        "workspace_name": request.workspace_name,
        "document": request.document,
        "admin_email": request.admin_email,
        "created_at": datetime.utcnow(),
    }
    ws_result = await db[WORKSPACES_COLLECTION].insert_one(workspace_doc)
    workspace_id = str(ws_result.inserted_id)

    # Create admin user
    user_doc = {
        "name": request.admin_name,
        "email": request.admin_email,
        "hashed_password": hash_password(request.password),
        "role": UserRole.ADMIN.value,
        "workspace_id": workspace_id,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    user_result = await db[USERS_COLLECTION].insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    # Generate JWT
    token = create_jwt_token(user_id, workspace_id, UserRole.ADMIN.value)

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=request.admin_name,
            email=request.admin_email,
            role=UserRole.ADMIN,
            workspace_id=workspace_id,
            workspace_name=request.workspace_name,
        ),
    )


# --- Login ---

async def login(
    db: AsyncIOMotorDatabase,
    request: LoginRequest,
) -> TokenResponse:
    """
    Authenticate user with email/password (RF-02).
    Returns JWT token on success.
    """
    user = await db[USERS_COLLECTION].find_one({"email": request.email})
    if not user:
        raise ValueError("E-mail ou senha inválidos.")

    if not user.get("is_active", True):
        raise ValueError("Usuário desativado. Contate o administrador.")

    if not verify_password(request.password, user["hashed_password"]):
        raise ValueError("E-mail ou senha inválidos.")

    user_id = str(user["_id"])
    workspace_id = user["workspace_id"]
    role = user["role"]

    # Fetch workspace name
    workspace = await db[WORKSPACES_COLLECTION].find_one(
        {"_id": ObjectId(workspace_id)}
    )
    workspace_name = workspace["workspace_name"] if workspace else ""

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
        ),
    )


# --- User Management ---

async def get_user_by_id(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> Optional[dict]:
    """Fetch a user by their ID."""
    try:
        user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
        return user
    except Exception:
        return None


async def get_user_profile(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> Optional[UserResponse]:
    """Get full user profile with workspace name."""
    user = await get_user_by_id(db, user_id)
    if not user:
        return None

    workspace = await db[WORKSPACES_COLLECTION].find_one(
        {"_id": ObjectId(user["workspace_id"])}
    )
    workspace_name = workspace["workspace_name"] if workspace else ""

    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=UserRole(user["role"]),
        workspace_id=user["workspace_id"],
        workspace_name=workspace_name,
        is_active=user.get("is_active", True),
    )


async def invite_user(
    db: AsyncIOMotorDatabase,
    request: InviteRequest,
    workspace_id: str,
) -> dict:
    """
    Create a user invite (RF-04).
    In MVP, creates the user directly with a temporary password.
    """
    # Check if email already exists
    existing = await db[USERS_COLLECTION].find_one({"email": request.email})
    if existing:
        raise ValueError("E-mail já cadastrado.")

    # Create invite token
    import secrets
    token = secrets.token_urlsafe(32)

    invite_doc = {
        "workspace_id": workspace_id,
        "email": request.email,
        "name": request.name,
        "role": request.role.value,
        "token": token,
        "expires_at": datetime.utcnow() + timedelta(days=7),
        "used": False,
        "created_at": datetime.utcnow(),
    }
    await db[INVITES_COLLECTION].insert_one(invite_doc)

    return {"token": token, "email": request.email, "message": "Convite criado com sucesso."}


async def accept_invite(
    db: AsyncIOMotorDatabase,
    token: str,
    password: str,
) -> TokenResponse:
    """Accept an invite and create user account."""
    invite = await db[INVITES_COLLECTION].find_one({"token": token, "used": False})
    if not invite:
        raise ValueError("Convite inválido ou já utilizado.")

    if invite["expires_at"] < datetime.utcnow():
        raise ValueError("Convite expirado.")

    # Create user
    user_doc = {
        "name": invite["name"],
        "email": invite["email"],
        "hashed_password": hash_password(password),
        "role": invite["role"],
        "workspace_id": invite["workspace_id"],
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    user_result = await db[USERS_COLLECTION].insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    # Mark invite as used
    await db[INVITES_COLLECTION].update_one(
        {"_id": invite["_id"]},
        {"$set": {"used": True}},
    )

    # Fetch workspace name
    workspace = await db[WORKSPACES_COLLECTION].find_one(
        {"_id": ObjectId(invite["workspace_id"])}
    )
    workspace_name = workspace["workspace_name"] if workspace else ""

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
        ),
    )


async def revoke_user(
    db: AsyncIOMotorDatabase,
    user_id: str,
    admin_workspace_id: str,
) -> dict:
    """Deactivate a user (RF-08). Admin only."""
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
