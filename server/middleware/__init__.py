"""
Maia Platform — Auth Middleware
FastAPI dependencies for JWT validation and RBAC (RF-05, RNF-04).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from database import get_database
from services.auth_service import verify_jwt_token, get_user_by_id
from models.user import UserRole

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency: extract and validate JWT from Authorization header.
    Returns the full user dict from MongoDB.
    Raises 401 if token is invalid or user not found.
    """
    token = credentials.credentials
    payload = verify_jwt_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

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
    user["_user_id"] = str(user["_id"])
    user["_workspace_id"] = payload.get("workspace_id", "")
    user["_role"] = payload.get("role", "")

    return user


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
