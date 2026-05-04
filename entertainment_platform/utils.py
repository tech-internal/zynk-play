# entertainment_platform/utils.py
# Utility functions for the platform

import hmac
import hashlib
import json
from datetime import datetime, timedelta
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# SMS/OTP UTILITIES
# ============================================================================

def send_sms_otp(phone_number, otp_code):
    """
    Send OTP via SMS using your SMS provider (e.g., Twilio, AWS SNS, etc.)
    
    Example using a generic SMS provider API:
    """
    try:
        # Example: Using a mock SMS service
        # In production, integrate with Twilio, AWS SNS, or your local SMS provider
        
        sms_service_url = getattr(settings, 'SMS_SERVICE_URL', None)
        sms_api_key = getattr(settings, 'SMS_API_KEY', None)
        
        if not sms_service_url or not sms_api_key:
            # Fallback: Log the OTP (for development/testing)
            logger.info(f"[DEV] OTP for {phone_number}: {otp_code}")
            return True
        
        payload = {
            'phone': phone_number,
            'message': f'Your entertainment platform OTP is: {otp_code}. Valid for 5 minutes.',
            'api_key': sms_api_key
        }
        
        response = requests.post(sms_service_url, json=payload, timeout=10)
        response.raise_for_status()
        
        logger.info(f"OTP sent successfully to {phone_number}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send OTP to {phone_number}: {str(e)}")
        raise


def validate_otp_rate_limit(phone_number, max_attempts=3, window_minutes=5):
    """
    Check if phone number has exceeded OTP request limit
    """
    from django.core.cache import cache
    
    cache_key = f"otp_attempts:{phone_number}"
    attempts = cache.get(cache_key, 0)
    
    if attempts >= max_attempts:
        return False
    
    return True


# ============================================================================
# STREAM SIGNING UTILITIES
# ============================================================================

def generate_signed_url(content_id, user_id, expires_in_seconds=300):
    """
    Generate a signed URL for stream access
    Useful for verifying stream access without additional DB queries
    """
    import time
    import base64
    
    expiry = int(time.time()) + expires_in_seconds
    message = f"{content_id}:{user_id}:{expiry}"
    
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    payload = f"{message}:{signature}"
    signed_url_token = base64.b64encode(payload.encode()).decode()
    
    return f"{settings.STREAM_BASE_URL}/stream/{signed_url_token}"


def verify_signed_url(signed_url_token):
    """
    Verify a signed stream URL token
    Returns tuple: (is_valid, content_id, user_id, expired)
    """
    import time
    import base64
    
    try:
        payload = base64.b64decode(signed_url_token).decode()
        parts = payload.split(':')
        
        if len(parts) != 4:
            return (False, None, None, False)
        
        content_id, user_id, expiry_str, signature = parts
        expiry = int(expiry_str)
        
        # Check expiry
        if int(time.time()) > expiry:
            return (False, content_id, user_id, True)
        
        # Verify signature
        message = f"{content_id}:{user_id}:{expiry_str}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if signature != expected_sig:
            return (False, None, None, False)
        
        return (True, content_id, user_id, False)
        
    except Exception as e:
        logger.error(f"Error verifying signed URL: {e}")
        return (False, None, None, False)


# ============================================================================
# PAYMENT UTILITIES
# ============================================================================

def _payment_webhook_secrets():
    """Ordered list of secrets that may sign provider callbacks (e.g. Palzio mock + production PSP)."""
    out = []
    for key in ('PAYMENT_WEBHOOK_SECRET', 'PALZIO_PSP_SHARED_SECRET'):
        v = (getattr(settings, key, None) or '').strip()
        if v and v not in out:
            out.append(v)
    return out


def validate_payment_signature(payload_dict, signature):
    """
    Validate payment provider webhook signature (HMAC-SHA256 over canonical JSON).
    """
    try:
        secrets = _payment_webhook_secrets()

        if not secrets:
            logger.warning('Payment webhook secret not configured')
            if getattr(settings, 'DEBUG', False):
                return True
            return False

        canonical_string = json.dumps(payload_dict, sort_keys=True, separators=(',', ':'))

        for payment_secret in secrets:
            expected_signature = hmac.new(
                payment_secret.encode(),
                canonical_string.encode(),
                hashlib.sha256,
            ).hexdigest()
            if hmac.compare_digest(signature or '', expected_signature):
                return True
        return False

    except Exception as e:
        logger.error(f'Error validating payment signature: {e}')
        return False


def create_payment_request(transaction_ref, amount, phone_number, plan_name):
    """
    Create a payment request with your payment provider
    Returns payment URL for redirection
    """
    try:
        payment_provider_url = getattr(settings, 'PAYMENT_PROVIDER_URL', None)
        payment_api_key = getattr(settings, 'PAYMENT_API_KEY', None)
        
        if not payment_provider_url or not payment_api_key:
            raise ValueError("Payment provider configuration missing")
        
        payload = {
            'merchant_id': getattr(settings, 'PAYMENT_MERCHANT_ID', 'merchant_id'),
            'transaction_ref': transaction_ref,
            'amount': str(amount),
            'currency': 'AFN',
            'phone_number': phone_number,
            'description': f'Entertainment Platform - {plan_name}',
            'callback_url': f"{settings.SITE_URL}/api/v1/payments/webhook",
            'api_key': payment_api_key
        }
        
        response = requests.post(payment_provider_url, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return data.get('payment_url', None)
        
    except Exception as e:
        logger.error(f"Failed to create payment request: {e}")
        raise


# ============================================================================
# GAME SESSION UTILITIES
# ============================================================================

def generate_game_session_token(game_id, user_id):
    """
    Generate a secure session token for game launch
    """
    import time
    import uuid
    
    token_data = {
        'game_id': str(game_id),
        'user_id': str(user_id),
        'timestamp': int(time.time()),
        'nonce': str(uuid.uuid4())
    }
    
    message = json.dumps(token_data, sort_keys=True)
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    token_data['signature'] = signature
    
    import base64
    return base64.b64encode(json.dumps(token_data).encode()).decode()


def verify_game_session_token(token):
    """
    Verify and decode game session token
    """
    import base64
    import time
    
    try:
        data = json.loads(base64.b64decode(token).decode())
        
        signature = data.pop('signature')
        message = json.dumps(data, sort_keys=True)
        
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            return (False, None, None)
        
        # Check if token is still valid (5 minutes)
        if int(time.time()) - data['timestamp'] > 300:
            return (False, data.get('game_id'), data.get('user_id'))
        
        return (True, data.get('game_id'), data.get('user_id'))
        
    except Exception as e:
        logger.error(f"Error verifying game token: {e}")
        return (False, None, None)


# ============================================================================
# SUBSCRIPTION UTILITIES
# ============================================================================

def check_subscription_expiry():
    """
    Task to check and update expired subscriptions
    Can be run by Celery periodically
    """
    from django.utils import timezone
    from .models import UserSubscription
    
    expired_subs = UserSubscription.objects.filter(
        status='active',
        end_at__lte=timezone.now()
    )
    
    count = expired_subs.update(status='expired')
    logger.info(f"Marked {count} subscriptions as expired")
    return count


def clean_expired_otp_requests():
    """
    Task to clean up expired OTP requests
    Can be run by Celery periodically
    """
    from django.utils import timezone
    from .models import OTPRequest
    
    expired_otps = OTPRequest.objects.filter(
        expires_at__lte=timezone.now(),
        status='pending'
    )
    
    count = expired_otps.update(status='expired')
    logger.info(f"Marked {count} OTP requests as expired")
    return count


# ============================================================================
# ANALYTICS/AUDIT UTILITIES
# ============================================================================

def log_audit_action(user, module, action, metadata=None, ip_address=None):
    """
    Log audit trail for compliance and debugging
    """
    from .models import AuditLog
    
    AuditLog.objects.create(
        module=module,
        action=action,
        actor_user=user,
        metadata=metadata or {},
        ip_address=ip_address
    )


def get_user_activity_summary(user, days=7):
    """
    Get user activity summary for the last N days
    """
    from .models import StreamSession, GameSession, Transaction
    from django.utils import timezone
    from datetime import timedelta
    
    start_date = timezone.now() - timedelta(days=days)
    
    return {
        'streams_watched': StreamSession.objects.filter(
            user=user,
            created_at__gte=start_date
        ).count(),
        'games_played': GameSession.objects.filter(
            user=user,
            created_at__gte=start_date
        ).count(),
        'payments_made': Transaction.objects.filter(
            user=user,
            status='success',
            created_at__gte=start_date
        ).count(),
    }
