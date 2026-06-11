# JWT authentication for platform User (non-django.contrib.auth user model)

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from .models import User


class PlatformUserJWTAuthentication(JWTAuthentication):
    """Load entertainment_platform.User from SimpleJWT's user_id claim."""

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if header.startswith('Bearer '):
            raw = header[7:].strip()
            if raw.count('.') == 2:
                try:
                    from jwt import decode as jwt_decode
                    from django.conf import settings

                    unverified = jwt_decode(
                        raw,
                        options={'verify_signature': False},
                        algorithms=['HS256'],
                    )
                    if unverified.get('token_type') == 'service':
                        return None
                except Exception:
                    pass
        return super().authenticate(request)

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError as exc:
            raise InvalidToken("Token contained no recognizable user identification") from exc

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist as exc:
            raise AuthenticationFailed("User not found", code="user_not_found") from exc

        if user.status != "active":
            raise AuthenticationFailed("User account is not active", code="user_inactive")

        return user
