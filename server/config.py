"""
Maia Platform — Centralized Configuration
Uses pydantic-settings for typed, validated environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = "mongodb://mongodb:27017"
    DATABASE_NAME: str = "vettalaw"

    # AI Provider
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""

    # RAG / Embeddings
    CHROMA_URL: str = "local"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Auth (RF-02, RF-07, RNF-05)
    # No default — must be explicitly set via environment variable.
    # Generate a strong secret: python -c "import secrets; print(secrets.token_hex(64))"
    JWT_SECRET: str
    JWT_EXPIRATION_HOURS: int = 8
    BCRYPT_ROUNDS: int = 12

    # Encryption key (64-char hex = 256-bit AES key)
    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
    ENCRYPTION_KEY: str = ""

    # Server
    APP_NAME: str = "Maia Platform API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Email Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "noreply@maia.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@maia.com"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://maia.vettahub.com.br",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
