import logging

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body: str):
    """
    Mock SMTP email service.
    In production, this would use a real SMTP server or an email API like SendGrid/AWS SES.
    """
    logger.info(f"📧 [EMAIL MOCK] Sending to {to_email}")
    logger.info(f"   Subject: {subject}")
    logger.info(f"   Body: {body}")
    
    # Simulate network delay
    import asyncio
    await asyncio.sleep(0.5)
    return True
