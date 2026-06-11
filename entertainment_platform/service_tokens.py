"""JWT access tokens for service-to-service API integration."""

from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings


def issue_service_access_token(client_id: str) -> tuple[str, int]:
    """Mint a bearer token for integration clients."""
    lifetime_hours = getattr(settings, 'API_INTEGRATION_TOKEN_LIFETIME_HOURS', 24)
    lifetime = timedelta(hours=lifetime_hours)
    now = datetime.now(timezone.utc)
    exp = now + lifetime
    payload = {
        'token_type': 'service',
        'sub': client_id,
        'iat': now,
        'exp': exp,
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token, int(lifetime.total_seconds())


def decode_service_access_token(raw_token: str) -> dict:
    """Validate and decode a service access token."""
    return jwt.decode(
        raw_token,
        settings.SECRET_KEY,
        algorithms=['HS256'],
        options={'require': ['exp', 'iat', 'sub', 'token_type']},
    )
