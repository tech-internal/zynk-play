"""Authentication for integration service bearer tokens."""

import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .service_tokens import decode_service_access_token


class ServicePrincipal:
    """Authenticated integration client (not a platform user)."""

    is_authenticated = True
    is_anonymous = False
    role = 'service'

    def __init__(self, client_id: str):
        self.client_id = client_id
        self.id = client_id
        self.pk = client_id


class ServiceTokenAuthentication(BaseAuthentication):
    """
    Bearer tokens issued by POST /api/v1/auth/token.
    Returns None for user JWTs so PlatformUserJWTAuthentication can handle them.
    """

    www_authenticate_realm = 'api'

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return None

        raw_token = header[7:].strip()
        if not raw_token:
            return None

        try:
            unverified = jwt.decode(
                raw_token,
                options={'verify_signature': False},
                algorithms=['HS256'],
            )
        except jwt.InvalidTokenError:
            return None

        if unverified.get('token_type') != 'service':
            return None

        try:
            payload = decode_service_access_token(raw_token)
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationFailed('Service token expired') from exc
        except jwt.InvalidTokenError as exc:
            raise AuthenticationFailed('Invalid service token') from exc

        client_id = payload.get('sub')
        if not client_id:
            raise AuthenticationFailed('Service token missing client identity')

        return ServicePrincipal(client_id), raw_token
