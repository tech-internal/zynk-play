from rest_framework.permissions import BasePermission

from entertainment_platform.permissions import IsPlatformStaff
from entertainment_platform.service_auth import ServicePrincipal


class IsXPAdmin(IsPlatformStaff):
    """Staff users may manage rules and reverse transactions."""

    message = 'Platform staff role required for XP admin operations.'


class CanTriggerXPForUser(BasePermission):
    """Users may trigger XP for themselves; staff may trigger for any user."""

    def has_permission(self, request, view):
        return bool(getattr(request.user, 'is_authenticated', False))

    def has_object_permission(self, request, view, obj):
        return True


class IsServiceAuthenticated(BasePermission):
    """Integration bearer token from POST /api/v1/auth/token."""

    message = 'Valid integration service bearer token required.'

    def has_permission(self, request, view):
        return isinstance(getattr(request, 'user', None), ServicePrincipal)
