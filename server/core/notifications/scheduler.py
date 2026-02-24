"""
Maia Platform — Notifications Scheduler
Background task to check deadlines and send email alerts.
"""
import asyncio
from datetime import datetime, timedelta
from bson import ObjectId

from database import get_database
from core.notifications.email_sender import send_email


async def check_and_send_deadline_alerts():
    """
    Check the 'prazos' collection for upcoming deadlines (<= 48h)
    that have not been notified yet. Send an email to the user.
    """
    db = get_database()
    now = datetime.utcnow()
    two_days_from_now = (now + timedelta(days=2)).strftime("%Y-%m-%d")
    today = now.strftime("%Y-%m-%d")

    # Find deadlines that are pending, not notified, and due in the next 48h (or overdue)
    query = {
        "status": "pendente",
        "notified": {"$ne": True},
        "data_limite": {"$lte": two_days_from_now}
    }

    try:
        async for prazo in db["prazos"].find(query):
            user_id = prazo.get("created_by")
            if not user_id:
                continue

            user = await db["users"].find_one({"_id": ObjectId(user_id)})
            if not user or not user.get("email"):
                continue

            # Fetch case title if available
            caso_str = "Sem caso vinculado"
            if prazo.get("caso_id"):
                caso = await db["casos"].find_one({"_id": ObjectId(prazo["caso_id"])})
                if caso:
                    caso_str = caso.get("titulo", caso_str)

            # Prepare email content
            subject = f"⚠️ Alerta de Prazo Maia: {prazo['titulo']}"
            body_text = f"""Olá {user.get('nome', 'Usuário')},

Lembramos que o seguinte prazo se aproxima ou está vencido:

⚖️ Caso: {caso_str}
📅 Prazo: {prazo['titulo']}
⏳ Data Limite: {prazo['data_limite']}
🔴 Prioridade: {prazo.get('prioridade', 'media').upper()}

Acesse o sistema Maia para mais detalhes: http://localhost:5173/prazos

Atenciosamente,
Equipe VettaLaw Maia
"""
            # Send email
            sent = await send_email(user["email"], subject, body_text)
            
            # If successfully sent (or mocked successfully), mark as notified
            if sent:
                await db["prazos"].update_one(
                    {"_id": prazo["_id"]},
                    {"$set": {"notified": True, "updated_at": datetime.utcnow()}}
                )
                print(f"🔔 Alerta de prazo configurado para {user['email']} (Prazo ID: {prazo['_id']})")

    except Exception as e:
        print(f"❌ Erro no scheduler de notificações: {e}")


async def start_notification_scheduler():
    """
    Background task loop to check deadlines periodically.
    Runs every 24 hours (86400 seconds) in production, 
    but for demonstration we check every 5 minutes.
    """
    interval_seconds = 300  # Check every 5 minutes
    print(f"⏰ Notificações auto-scheduler iniciado (intervalo: {interval_seconds}s)")

    # Initial delay to let the app finish startup correctly
    await asyncio.sleep(10)

    while True:
        await check_and_send_deadline_alerts()
        await asyncio.sleep(interval_seconds)
