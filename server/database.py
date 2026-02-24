"""
Maia Platform — Database Connection
MongoDB async client using Motor with lifespan context manager.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import get_settings

# Module-level state
_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Initialize MongoDB connection."""
    global _client, _database
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _database = _client[settings.DATABASE_NAME]
    print(f"✅ Connected to MongoDB at {settings.MONGODB_URL}")


async def disconnect_db() -> None:
    """Close MongoDB connection."""
    global _client, _database
    if _client:
        _client.close()
        _client = None
        _database = None
        print("❌ Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance. Must be called after connect_db()."""
    if _database is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _database
