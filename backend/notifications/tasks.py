from celery import shared_task
from django.core.mail import EmailMultiAlternatives
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(subject, text_content, html_content, to_emails):
    try:
        msg = EmailMultiAlternatives(subject, text_content, None, to_emails)
        if html_content:
            msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"Email sent to {to_emails}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_emails}: {e}")

@shared_task
def send_push_notification_task(user_id, title, message):
    try:
        # Mock Firebase Cloud Messaging
        logger.info(f"FCM Push to User {user_id}: {title} - {message}")
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")

@shared_task
def send_sms_task(phone_number, message):
    try:
        # Mock Twilio SMS
        logger.info(f"SMS to {phone_number}: {message}")
    except Exception as e:
        logger.error(f"Failed to send SMS: {e}")

@shared_task
def send_whatsapp_task(phone_number, message):
    try:
        # Mock Twilio WhatsApp
        logger.info(f"WhatsApp to {phone_number}: {message}")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp: {e}")
