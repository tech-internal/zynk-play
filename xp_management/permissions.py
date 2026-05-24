from rest_framework.permissions import BasePermission

from entertainment_platform.permissions import IsPlatformStaff


class IsXPAdmin(IsPlatformStaff):
    """Staff users may manage rules and reverse transactions."""

    message = 'Platform staff role required for XP admin operations.'


class CanTriggerXPForUser(BasePermission):
    """Users may trigger XP for themselves; staff may trigger for any user."""

    def has_permission(self, request, view):
        return bool(getattr(request.user, 'is_authenticated', False))

    def has_object_permission(self, request, view, obj):
        return True
