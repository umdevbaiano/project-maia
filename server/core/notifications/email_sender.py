"""
Maia Platform — Email Sender Service
Handles sending async emails via SMTP.
"""
import aiosmtplib
from email.message import EmailMessage
from config import get_settings


async def send_email(to_email: str, subject: str, body_text: str, body_html: str = None) -> bool:
    """
    Send an email asynchronously.
    Returns True if successful, False otherwise.
    """
    settings = get_settings()
    
    # If SMTP is not fully configured, just log it (useful for local dev without real SMTP)
    if not settings.SMTP_PASSWORD or settings.SMTP_PASSWORD == "dummy-password":
        print(f"📧 [EMAIL MOCKED] To: {to_email} | Subject: {subject}")
        print(f"   Body: {body_text[:100]}...")
        return True

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body_text)

    if body_html:
        message.add_alternative(body_html, subtype="html")

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            start_tls=True,
            timeout=5,
        )
        print(f"✅ Email enviado para {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar email para {to_email}: {e}")
        return False
