from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import get_settings

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None

async def _init_indexes(db: AsyncIOMotorDatabase) -> None:
    collections = ["casos", "clientes", "prazos", "documentos", "pecas", "audit", "chat_messages", "templates"]
    for col in collections:
        try:
            await db[col].create_index("workspace_id")
            await db[col].create_index([("workspace_id", 1), ("created_at", -1)])
        except Exception as e:
            print(f"⚠️ Index error ({col}): {e}")

async def connect_db() -> None:
    global _client, _database
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _database = _client[settings.DATABASE_NAME]
    
    await _init_indexes(_database)
    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def disconnect_db() -> None:
    global _client, _database
    if _client:
        _client.close()
        _client = _database = None
        print("❌ Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _database
