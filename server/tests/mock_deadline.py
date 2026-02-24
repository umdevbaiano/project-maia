import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

async def create_dummy_deadline():
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    db = client["vettalaw"]
    
    # Get a user (e.g. admin@maia.com)
    user = await db["users"].find_one({"email": "admin@maia.com"})
    if not user:
        print("Admin user not found. Creating one.")
        return
        
    workspace_id = user.get("_workspace_id") or "ws_dummy"
    
    now = datetime.utcnow()
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    
    dummy_prazo = {
        "titulo": "Audiência de Conciliação (Teste de Email)",
        "descricao": "Teste do Auto-Scheduler de Notificações",
        "data_limite": tomorrow,
        "status": "pendente",
        "prioridade": "alta",
        "notified": False,
        "workspace_id": workspace_id,
        "created_by": str(user["_id"]),
        "created_at": now,
        "updated_at": now
    }
    
    result = await db["prazos"].insert_one(dummy_prazo)
    print(f"Dummy deadline created with ID: {result.inserted_id}")

if __name__ == "__main__":
    asyncio.run(create_dummy_deadline())
