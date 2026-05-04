from rest_framework.permissions import BasePermission


class IsPlatformStaff(BasePermission):
    """Users with role=staff may manage catalog plans via API."""

    message = 'Platform staff role required.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and getattr(user, 'is_authenticated', False) and getattr(user, 'role', '') == 'staff')
