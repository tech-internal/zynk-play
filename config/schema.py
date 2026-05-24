"""
drf-spectacular extensions: JWT auth for platform User model.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class PlatformJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'entertainment_platform.authentication.PlatformUserJWTAuthentication'
    name = 'BearerAuth'
    match_subclasses = True

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': (
                'Platform JWT from POST /api/v1/auth/verify-otp. '
                'Use header: Authorization: Bearer <access_token>'
            ),
        }
