import logging
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import get_settings
from database import get_database
from services.auth_service import verify_jwt_token, get_user_by_id
from cachetools import TTLCache
from models.user import UserRole

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)

# 5 minutes TTL Cache to massively reduce DB hits per API Request (Max 1000 concurrent sessions cached)
user_cache = TTLCache(maxsize=1000, ttl=300)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency: extract and validate JWT from Authorization header.
    Returns the full user dict from MongoDB.
    Raises 401 if token is invalid or user not found.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_jwt_token(token)

    if payload is None:
        logger.warning("Auth Middleware: Invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    workspace_id = payload.get("workspace_id")
    
    if not user_id:
        logger.warning("Auth Middleware: Token missing 'sub' (user_id)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido (faltando sub).",
        )

    # 1. Check in-memory Cache first
    if user_id in user_cache:
        cached_user = user_cache[user_id]
        if not cached_user.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário desativado.")
        return cached_user

    # 2. Cache Miss -> Hit the DB
    db = get_database()
    user = await get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado.",
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário desativado.",
        )

    # Attach parsed JWT claims for convenience
    # We ensure these start with underscore to avoid collision with DB fields
    user["_user_id"] = str(user["_id"])
    user["_workspace_id"] = str(workspace_id) if workspace_id else str(user.get("workspace_id", ""))
    user["_role"] = payload.get("role", user.get("role", ""))

    if not user["_workspace_id"]:
        logger.error(f"Auth Middleware: User {user_id} has no workspace_id in token or DB")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário sem workspace vinculado.")

    # Populate Cache
    user_cache[user_id] = user

    return user


async def get_current_user_or_demo(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency for demo mode.
    If DEMO_MODE is active and no valid token is provided, returns a fixed demo user.
    Otherwise, behaves like get_current_user.
    """
    settings = get_settings()

    # Try real auth first if credentials are provided
    if credentials and credentials.credentials:
        try:
            return await get_current_user(credentials)
        except HTTPException:
            if not settings.DEMO_MODE:
                raise

    # Fall back to demo user if DEMO_MODE is active
    if settings.DEMO_MODE:
        return {
            "_user_id": settings.DEMO_USER_ID,
            "_workspace_id": settings.DEMO_WORKSPACE_ID,
            "_role": "admin",
            "name": "Advogado (Demo)",
            "email": "demo@maia.test",
            "is_active": True,
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token não fornecido.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_roles(*allowed_roles: UserRole):
    """
    Factory for RBAC dependency.
    Usage: Depends(require_roles(UserRole.ADMIN, UserRole.SOCIO))
    """
    async def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        user_role = current_user.get("_role", "")
        allowed_values = [r.value for r in allowed_roles]

        if user_role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão insuficiente para esta ação.",
            )
        return current_user

    return role_checker
