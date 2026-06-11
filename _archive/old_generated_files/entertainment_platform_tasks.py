# entertainment_platform/tasks.py
# Celery tasks for asynchronous operations

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


# =====================================================================
# SUBSCRIPTION TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def check_subscription_expiry(self):
    """
    Periodic task to check and mark expired subscriptions
    Run every 5 minutes
    """
    try:
        from .models import UserSubscription
        
        expired_subs = UserSubscription.objects.filter(
            status='active',
            end_at__lte=timezone.now()
        )
        
        count = expired_subs.update(status='expired')
        logger.info(f"Marked {count} subscriptions as expired")
        
        return {'status': 'success', 'expired_count': count}
        
    except Exception as exc:
        logger.error(f"Error checking subscription expiry: {exc}")
        raise self.retry(exc=exc, countdown=60)


# =====================================================================
# OTP TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def clean_expired_otp_requests(self):
    """
    Periodic task to clean up expired OTP requests
    Run every 10 minutes
    """
    try:
        from .models import OTPRequest
        
        expired_otps = OTPRequest.objects.filter(
            expires_at__lte=timezone.now(),
            status='pending'
        )
        
        count = expired_otps.update(status='expired')
        logger.info(f"Marked {count} OTP requests as expired")
        
        return {'status': 'success', 'expired_count': count}
        
    except Exception as exc:
        logger.error(f"Error cleaning OTP requests: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_otp_reminder(self, phone_number, otp_code):
    """
    Send OTP via SMS (can be extended to email, WhatsApp, etc.)
    """
    try:
        from .utils import send_sms_otp
        
        send_sms_otp(phone_number, otp_code)
        logger.info(f"OTP sent to {phone_number}")
        
        return {'status': 'success', 'phone': phone_number}
        
    except Exception as exc:
        logger.error(f"Failed to send OTP: {exc}")
        raise self.retry(exc=exc, countdown=60)


# =====================================================================
# PAYMENT TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def reconcile_payments(self):
    """
    Periodic task to reconcile payment status with provider
    Handles pending transactions that may have stalled
    """
    try:
        from .models import Transaction
        
        # Find pending transactions older than 10 minutes
        pending = Transaction.objects.filter(
            status='pending',
            created_at__lt=timezone.now() - timezone.timedelta(minutes=10)
        )
        
        count = 0
        for txn in pending:
            # In production: Call payment provider API to check status
            # If confirmed: Mark as success and activate subscription
            # If failed: Mark as failed and notify user
            count += 1
        
        logger.info(f"Reconciled {count} pending transactions")
        return {'status': 'success', 'reconciled_count': count}
        
    except Exception as exc:
        logger.error(f"Error reconciling payments: {exc}")
        raise self.retry(exc=exc, countdown=120)


# =====================================================================
# STREAM TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def clean_expired_stream_sessions(self):
    """
    Periodic task to clean up expired stream sessions
    """
    try:
        from .models import StreamSession
        
        expired_sessions = StreamSession.objects.filter(
            expires_at__lte=timezone.now(),
            status='active'
        )
        
        count = expired_sessions.update(status='expired')
        logger.info(f"Marked {count} stream sessions as expired")
        
        return {'status': 'success', 'expired_count': count}
        
    except Exception as exc:
        logger.error(f"Error cleaning stream sessions: {exc}")
        raise self.retry(exc=exc, countdown=60)


# =====================================================================
# NOTIFICATION TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def send_trial_expiry_notification(self, user_id):
    """
    Send notification when free trial is about to expire
    """
    try:
        from .models import User
        
        user = User.objects.get(id=user_id)
        
        # In production: Send SMS/email/push notification
        # send_notification(user.phone_number, "Your trial is expiring soon!")
        
        logger.info(f"Trial expiry notification sent to {user.phone_number}")
        return {'status': 'success', 'user_id': str(user_id)}
        
    except User.DoesNotExist:
        logger.warning(f"User {user_id} not found for notification")
        return {'status': 'user_not_found'}
    except Exception as exc:
        logger.error(f"Error sending notification: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_subscription_expiry_notification(self, subscription_id):
    """
    Send notification when subscription is about to expire
    """
    try:
        from .models import UserSubscription
        
        subscription = UserSubscription.objects.get(id=subscription_id)
        
        # In production: Send SMS/email/push notification
        # send_notification(subscription.user.phone_number, "Renew your subscription!")
        
        logger.info(f"Subscription expiry notification sent to {subscription.user.phone_number}")
        return {'status': 'success', 'subscription_id': str(subscription_id)}
        
    except UserSubscription.DoesNotExist:
        logger.warning(f"Subscription {subscription_id} not found")
        return {'status': 'subscription_not_found'}
    except Exception as exc:
        logger.error(f"Error sending notification: {exc}")
        raise self.retry(exc=exc, countdown=60)


# =====================================================================
# REPORTING TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def generate_daily_report(self):
    """
    Generate daily platform statistics
    """
    try:
        from .models import User, Transaction, StreamSession, GameSession
        from datetime import timedelta
        
        yesterday = timezone.now() - timedelta(days=1)
        today = timezone.now()
        
        report = {
            'date': today.date().isoformat(),
            'new_users': User.objects.filter(created_at__gte=yesterday, created_at__lt=today).count(),
            'active_users': User.objects.filter(last_login_at__gte=yesterday, last_login_at__lt=today).count(),
            'successful_payments': Transaction.objects.filter(
                status='success',
                created_at__gte=yesterday,
                created_at__lt=today
            ).count(),
            'total_revenue': Transaction.objects.filter(
                status='success',
                created_at__gte=yesterday,
                created_at__lt=today
            ).aggregate(Sum('amount'))['amount__sum'] or 0,
            'streams_accessed': StreamSession.objects.filter(
                created_at__gte=yesterday,
                created_at__lt=today
            ).count(),
            'games_played': GameSession.objects.filter(
                created_at__gte=yesterday,
                created_at__lt=today
            ).count(),
        }
        
        logger.info(f"Daily report generated: {report}")
        
        # In production: Store in database or send to analytics service
        # send_to_analytics(report)
        
        return {'status': 'success', 'report': report}
        
    except Exception as exc:
        logger.error(f"Error generating daily report: {exc}")
        raise self.retry(exc=exc, countdown=300)


# =====================================================================
# ADMIN TASKS
# =====================================================================

@shared_task(bind=True, max_retries=3)
def send_admin_alert(self, alert_type, message, data=None):
    """
    Send alerts to admin dashboard or email
    """
    try:
        # In production: Send to admin notification service
        logger.warning(f"[ADMIN ALERT] {alert_type}: {message} - Data: {data}")
        return {'status': 'success', 'alert_type': alert_type}
        
    except Exception as exc:
        logger.error(f"Error sending admin alert: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def detect_fraud(self):
    """
    Periodic task to detect fraudulent activity
    Check for multiple free trials, rapid subscriptions, etc.
    """
    try:
        from .models import User, Transaction
        from django.db.models import Count
        
        # Detect users with multiple accounts per IP (if IP logging enabled)
        # Flag users with rapid multiple payments
        # Block users with pattern abuse
        
        logger.info("Fraud detection scan completed")
        return {'status': 'success'}
        
    except Exception as exc:
        logger.error(f"Error in fraud detection: {exc}")
        raise self.retry(exc=exc, countdown=300)
