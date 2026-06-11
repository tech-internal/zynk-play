from rest_framework.permissions import BasePermission

from .service_auth import ServicePrincipal


class IsServiceAuthenticated(BasePermission):
    """Integration bearer token from POST /api/v1/auth/token."""

    message = 'Valid integration service bearer token required.'

    def has_permission(self, request, view):
        return isinstance(getattr(request, 'user', None), ServicePrincipal)


class IsPlatformStaff(BasePermission):
    """Users with role=staff may manage catalog plans via API."""

    message = 'Platform staff role required.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and getattr(user, 'is_authenticated', False) and getattr(user, 'role', '') == 'staff')
