"""
Short-lived HMAC tokens for Palzio mock checkout (same process as platform).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from django.conf import settings


def palzio_signing_secret() -> str:
    s = (getattr(settings, 'PALZIO_PSP_SHARED_SECRET', None) or '').strip()
    if s:
        return s
    s = (getattr(settings, 'PAYMENT_WEBHOOK_SECRET', None) or '').strip()
    if s:
        return s
    if getattr(settings, 'DEBUG', False):
        return settings.SECRET_KEY
    return ''


def issue_palzio_checkout_token(
    *,
    transaction_ref: str,
    user_id: str,
    amount: str,
    currency: str,
    plan_name: str,
) -> str:
    secret = palzio_signing_secret()
    if not secret:
        raise RuntimeError('PALZIO_PSP_SHARED_SECRET or PAYMENT_WEBHOOK_SECRET must be set when DEBUG=False')

    ttl = int(getattr(settings, 'PALZIO_CHECKOUT_TTL_SECONDS', 3600))
    exp = int(time.time()) + ttl
    payload = {
        'transaction_ref': transaction_ref,
        'user_id': str(user_id),
        'exp': exp,
        'amount': str(amount),
        'currency': currency,
        'plan_name': (plan_name or '')[:120],
    }
    payload_json = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()
    payload_b64 = base64.urlsafe_b64encode(payload_json).decode().rstrip('=')
    sig = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f'v1.{payload_b64}.{sig}'


def verify_palzio_checkout_token(token: str) -> dict | None:
    secret = palzio_signing_secret()
    if not secret or not token:
        return None
    try:
        ver, payload_b64, sig = token.split('.', 2)
        if ver != 'v1':
            return None
        pad = '=' * (-len(payload_b64) % 4)
        raw = base64.urlsafe_b64decode(payload_b64 + pad)
        payload = json.loads(raw.decode())
        expected = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        if int(time.time()) > int(payload['exp']):
            return None
        return payload
    except (ValueError, json.JSONDecodeError, KeyError, TypeError):
        return None
