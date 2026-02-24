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

    # RAG / Embeddings
    CHROMA_URL: str = "http://chromadb:8000"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Auth (RF-02, RF-07, RNF-05)
    JWT_SECRET: str = "maia-platform-secret-change-in-production"
    JWT_EXPIRATION_HOURS: int = 8
    BCRYPT_ROUNDS: int = 12

    # Server
    APP_NAME: str = "Maia Platform API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
