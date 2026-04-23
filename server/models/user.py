"""
Maia Platform — User & Workspace Models
Pydantic models for authentication, RBAC, and multi-tenancy.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """RBAC roles (RF-03)."""
    ADMIN = "admin"
    SOCIO = "socio"
    ASSOCIADO = "associado"
    ESTAGIARIO = "estagiario"


# --- Database Document Shapes ---

class WorkspaceInDB(BaseModel):
    """Workspace stored in MongoDB."""
    workspace_name: str
    document: str  # CNPJ or CPF
    admin_email: str
    onboarding_completed: bool = False
    plan: str = "basic"
    ai_calls_count: int = 0
    ai_calls_reset_date: datetime | None = None
    storage_bytes_used: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserInDB(BaseModel):
    """User stored in MongoDB."""
    name: str
    email: str
    hashed_password: str
    role: UserRole
    workspace_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Request Models ---

class RegisterWorkspaceRequest(BaseModel):
    """Create workspace + admin user."""
    workspace_name: str = Field(..., min_length=2, max_length=100)
    document: str = Field(..., min_length=11, max_length=18)  # CPF or CNPJ
    admin_name: str = Field(..., min_length=2, max_length=100)
    admin_email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("A senha deve conter pelo menos um número.")
        if not any(c.isalpha() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra.")
        return v


class VerifyRegistrationRequest(BaseModel):
    """Verify OTP code sent to email to complete registration."""
    email: str
    code: str = Field(..., min_length=6, max_length=6)


class LoginRequest(BaseModel):
    """Login with email + password."""
    email: str
    password: str


class InviteRequest(BaseModel):
    """Invite a user to the workspace."""
    email: str
    name: str
    role: UserRole = UserRole.ASSOCIADO


class AcceptInviteRequest(BaseModel):
    """Accept an invite and set password."""
    token: str
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("A senha deve conter pelo menos um número.")
        if not any(c.isalpha() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra.")
        return v


# --- Response Models ---

class UserResponse(BaseModel):
    """Public user data (no password)."""
    id: str
    name: str
    email: str
    role: UserRole
    workspace_id: str
    workspace_name: str = ""
    workspace_onboarding_completed: bool = False
    is_active: bool = True


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class WorkspaceResponse(BaseModel):
    """Workspace public data."""
    id: str
    workspace_name: str
    document: str
    onboarding_completed: bool = False
    plan: str
    ai_calls_count: int
    storage_bytes_used: int
    created_at: str
