"""
OpenAPI / Swagger configuration for drf-spectacular.
Imported into Django settings as SPECTACULAR_SETTINGS.
"""

from decouple import config

from config.openapi_hooks import build_openapi_servers, is_placeholder_site_url

_site = config('SITE_URL', default='').strip().rstrip('/')
if is_placeholder_site_url(_site):
    _site = 'http://localhost:8000'
SITE_URL = _site

SPECTACULAR_SETTINGS = {
    'TITLE': 'Zynk Play API',
    'DESCRIPTION': """
Entertainment platform API: OTP authentication, subscriptions, streaming, games, payments, and XP rewards.

### Authentication
1. `POST /api/v1/auth/send-otp` with your phone number.
2. `POST /api/v1/auth/verify-otp` with the OTP (or use mock auth in development).
3. Click **Authorize** and paste the `access` JWT as: `Bearer <token>`.

### Mock auth (development)
- `POST /api/v1/mock/auth/send-otp` — always succeeds.
- `POST /api/v1/mock/auth/verify-otp` — use OTP `123456`.

### XP API envelope
XP endpoints return `{ success, data, meta }` on success and `{ success, error, meta }` on failure.
Include optional header `X-Request-Id` for tracing.

### Payments
Purchase flow: purchase plan -> complete checkout (Palzio mock PSP or demo-confirm when DEBUG) -> webhook activates subscription.
    """.strip(),
    'VERSION': '1.0.0',
    'CONTACT': {
        'name': 'Zynk Play Platform',
        'url': SITE_URL,
    },
    'LICENSE': {'name': 'Proprietary'},
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v1',
    # Keep full paths (/api/v1/...) so server URL stays http://localhost:8000 (works with /psp/ too).
    'SCHEMA_PATH_PREFIX_TRIM': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': True,
    'SORT_OPERATION_PARAMETERS': True,
    'TAGS': [
        {'name': 'Meta', 'description': 'API discovery and health.'},
        {'name': 'Auth', 'description': 'OTP login and JWT refresh.'},
        {'name': 'Auth (Mock)', 'description': 'Development-only OTP shortcuts.'},
        {'name': 'Users', 'description': 'Profile for the signed-in platform user.'},
        {'name': 'Subscriptions', 'description': 'Plans, purchase, and entitlements.'},
        {'name': 'Subscriptions (Staff)', 'description': 'Catalog management — requires staff role.'},
        {'name': 'Streaming', 'description': 'Catalog and signed playback URLs.'},
        {'name': 'Trial', 'description': 'One-time free trial sessions.'},
        {'name': 'Payments', 'description': 'Webhooks, history, and demo confirmation.'},
        {'name': 'Games', 'description': 'Game catalog and launch (requires game entitlement).'},
        {'name': 'XP', 'description': 'Experience points: earn, redeem, rules, leaderboard.'},
        {'name': 'XP (Admin)', 'description': 'Staff/admin XP operations.'},
        {'name': 'PSP (Mock)', 'description': 'Mock Palzio payment service provider.'},
    ],
    # Overridden per-request in postprocess_schema_servers (Swagger uses current host).
    'SERVERS': build_openapi_servers(),
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
        'filter': True,
        'tryItOutEnabled': True,
        'docExpansion': 'list',
        'defaultModelsExpandDepth': 2,
        'syntaxHighlight': {'theme': 'monokai'},
    },
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
        'expandResponses': '200,201',
        'pathInMiddlePanel': True,
    },
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'BearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
                'description': 'JWT access token from verify-otp or refresh. Prefix: Bearer',
            },
            'WebhookSignature': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-Signature',
                'description': 'HMAC-SHA256 hex digest of the JSON body (payment webhooks).',
            },
        },
    },
    'SECURITY': [{'BearerAuth': []}],
    'PREPROCESSING_HOOKS': [
        'config.openapi_hooks.preprocess_exclude_admin',
    ],
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
        'config.openapi_hooks.postprocess_schema_servers',
    ],
}
