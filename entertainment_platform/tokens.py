from rest_framework_simplejwt.tokens import RefreshToken


def issue_tokens_for_platform_user(user):
    """Mint JWT pair for platform User (UUID pk, not Django auth user)."""
    refresh = RefreshToken()
    refresh["user_id"] = str(user.pk)
    return refresh, str(refresh.access_token), str(refresh)
