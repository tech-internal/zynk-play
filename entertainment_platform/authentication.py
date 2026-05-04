# JWT authentication for platform User (non-django.contrib.auth user model)

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from .models import User


class PlatformUserJWTAuthentication(JWTAuthentication):
    """Load entertainment_platform.User from SimpleJWT's user_id claim."""

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
