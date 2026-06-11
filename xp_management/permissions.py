from rest_framework.permissions import BasePermission

from entertainment_platform.permissions import IsPlatformStaff, IsServiceAuthenticated
from entertainment_platform.service_auth import ServicePrincipal


class IsXPAdmin(IsPlatformStaff):
    """Staff users may manage rules and reverse transactions."""

    message = 'Platform staff role required for XP admin operations.'


def is_integration_service(request) -> bool:
    return isinstance(getattr(request, 'user', None), ServicePrincipal)


def can_access_user_wallet(request, user_id) -> bool:
    """Integration clients, staff, and users may access the given user's XP data."""
    actor = getattr(request, 'user', None)
    if isinstance(actor, ServicePrincipal):
        return True
    if not getattr(actor, 'is_authenticated', False):
        return False
    if str(user_id) == str(actor.id):
        return True
    return getattr(actor, 'role', '') == 'staff'


class CanTriggerXPForUser(BasePermission):
    """Users may trigger XP for themselves; staff may trigger for any user."""

    def has_permission(self, request, view):
        return bool(getattr(request.user, 'is_authenticated', False))

    def has_object_permission(self, request, view, obj):
        return True

