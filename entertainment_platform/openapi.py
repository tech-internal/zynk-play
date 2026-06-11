"""
OpenAPI schema decorators for entertainment_platform views.
Import and apply above @api_view in views.py.
"""

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers

from .serializers import (
    GameSerializer,
    GameSessionSerializer,
    SendOTPSerializer,
    ServiceTokenRequestSerializer,
    ServiceTokenResponseSerializer,
    StreamingContentSerializer,
    SubscriptionPlanManageSerializer,
    SubscriptionPlanSerializer,
    TokenResponseSerializer,
    TransactionSerializer,
    UserSerializer,
    UserSubscriptionSerializer,
    VerifyOTPSerializer,
)

# ---------------------------------------------------------------------------
# Shared response shapes
# ---------------------------------------------------------------------------

ErrorResponse = inline_serializer(
    name='ErrorResponse',
    fields={'error': serializers.CharField(), 'code': serializers.CharField(required=False)},
)

OTPSentResponse = inline_serializer(
    name='OTPSentResponse',
    fields={
        'message': serializers.CharField(),
        'expires_in_seconds': serializers.IntegerField(required=False),
    },
)

RefreshRequest = inline_serializer(
    name='RefreshTokenRequest',
    fields={'refresh': serializers.CharField()},
)

RefreshResponse = inline_serializer(
    name='RefreshTokenResponse',
    fields={'access': serializers.CharField()},
)

SubscriptionStatusResponse = inline_serializer(
    name='SubscriptionStatusResponse',
    fields={
        'has_active_subscription': serializers.BooleanField(),
        'has_game_entitlement': serializers.BooleanField(),
        'has_streaming_entitlement': serializers.BooleanField(),
        'can_use_trial': serializers.BooleanField(),
        'active_subscriptions': UserSubscriptionSerializer(many=True),
        'eligible_plan_ids': serializers.ListField(child=serializers.UUIDField()),
    },
)

PurchaseRequest = inline_serializer(
    name='PurchaseSubscriptionRequest',
    fields={'plan_id': serializers.UUIDField()},
)

PurchaseResponse = inline_serializer(
    name='PurchaseSubscriptionResponse',
    fields={
        'transaction_ref': serializers.CharField(),
        'plan_id': serializers.CharField(),
        'amount': serializers.CharField(),
        'currency': serializers.CharField(),
        'plan_name': serializers.CharField(),
        'checkout_token': serializers.CharField(),
        'palzio_checkout_path': serializers.CharField(),
        'redirect_url': serializers.CharField(),
        'demo_complete_hint': serializers.CharField(),
    },
)

StreamAccessResponse = inline_serializer(
    name='StreamAccessResponse',
    fields={
        'signed_url': serializers.CharField(),
        'expires_in_seconds': serializers.IntegerField(),
        'session_id': serializers.CharField(),
    },
)

LaunchGameResponse = inline_serializer(
    name='LaunchGameResponse',
    fields={'session_token': serializers.CharField(), 'game_source': serializers.CharField()},
)

PaymentWebhookRequest = inline_serializer(
    name='PaymentWebhookRequest',
    fields={
        'transaction_ref': serializers.CharField(),
        'provider_ref': serializers.CharField(required=False),
        'status': serializers.CharField(help_text='success | failed | insufficient_balance | user_dropped'),
        'payment_method': serializers.CharField(required=False),
        'provider': serializers.CharField(required=False),
    },
)

DemoConfirmRequest = inline_serializer(
    name='DemoConfirmRequest',
    fields={'transaction_ref': serializers.CharField()},
)

CancelSubscriptionRequest = inline_serializer(
    name='CancelSubscriptionRequest',
    fields={'status': serializers.CharField(help_text='Use cancelled for self-service cancel')},
)

# ---------------------------------------------------------------------------
# Decorators
# ---------------------------------------------------------------------------

schema_home = extend_schema(
    tags=['Meta'],
    summary='API index',
    description='JSON catalog of endpoints and documentation links. Prefer Swagger UI at /api/docs/.',
    responses={200: OpenApiResponse(description='API metadata and endpoint map')},
    auth=[],
)

schema_send_otp = extend_schema(
    tags=['Auth'],
    summary='Send OTP',
    description='Send a 6-digit OTP via SMS. Rate limited to 3 requests per 5 minutes per phone.',
    request=SendOTPSerializer,
    responses={
        200: OTPSentResponse,
        400: ErrorResponse,
        429: ErrorResponse,
        500: ErrorResponse,
    },
    examples=[
        OpenApiExample('Afghanistan mobile', value={'phone_number': '+93700123456'}),
    ],
    auth=[],
)

schema_verify_otp = extend_schema(
    tags=['Auth'],
    summary='Verify OTP and login',
    description='Verify OTP, create or load user, return JWT access/refresh and profile.',
    request=VerifyOTPSerializer,
    responses={
        200: TokenResponseSerializer,
        400: ErrorResponse,
    },
    examples=[
        OpenApiExample('Verify', value={'phone_number': '+93700123456', 'otp_code': '482910'}),
    ],
    auth=[],
)

schema_mock_send_otp = extend_schema(
    tags=['Auth (Mock)'],
    summary='Mock send OTP',
    description='No SMS sent; always returns success. For local development only.',
    request=SendOTPSerializer,
    responses={200: OTPSentResponse},
    auth=[],
)

schema_mock_verify_otp = extend_schema(
    tags=['Auth (Mock)'],
    summary='Mock verify OTP',
    description='Succeeds only when `otp_code` is `123456`.',
    request=VerifyOTPSerializer,
    responses={200: TokenResponseSerializer, 400: ErrorResponse},
    examples=[
        OpenApiExample('Mock login', value={'phone_number': '+93700123456', 'otp_code': '123456'}),
    ],
    auth=[],
)

schema_generate_service_token = extend_schema(
    tags=['Auth'],
    summary='Generate integration bearer token',
    description=(
        'Exchange integration client credentials for a bearer token. '
        'Use `Authorization: Bearer <access_token>` on integration endpoints such as '
        '`POST /api/v1/xp/grant-by-phone`.'
    ),
    request=ServiceTokenRequestSerializer,
    responses={
        200: ServiceTokenResponseSerializer,
        400: ErrorResponse,
        401: ErrorResponse,
        503: ErrorResponse,
    },
    examples=[
        OpenApiExample(
            'Integration login',
            value={'client_id': 'my-partner', 'client_secret': 'your-secret'},
        ),
    ],
    auth=[],
)

schema_refresh_token = extend_schema(
    tags=['Auth'],
    summary='Refresh access token',
    request=RefreshRequest,
    responses={200: RefreshResponse, 400: ErrorResponse},
    auth=[],
)

def schema_user_profile(view):
    view = extend_schema(
        tags=['Users'],
        methods=['GET'],
        summary='Get current user profile',
        responses={200: UserSerializer},
    )(view)
    return extend_schema(
        tags=['Users'],
        methods=['PUT', 'PATCH'],
        summary='Update current user profile',
        description='Updates username, full_name, email, country, languages. Phone is read-only.',
        request=UserSerializer,
        responses={200: UserSerializer, 400: ErrorResponse},
    )(view)

schema_list_plans = extend_schema(
    tags=['Subscriptions'],
    summary='List subscription plans',
    parameters=[
        OpenApiParameter('billing_period', str, description='daily | weekly | monthly'),
        OpenApiParameter('entitlement_type', str, description='game_only | streaming_only | game_and_streaming'),
        OpenApiParameter(
            'eligible_for_me',
            str,
            description='Set to 1 to filter plans the authenticated user may purchase (requires JWT).',
        ),
    ],
    responses={200: SubscriptionPlanSerializer(many=True), 401: ErrorResponse},
    auth=[],
)

schema_purchase_subscription = extend_schema(
    tags=['Subscriptions'],
    summary='Purchase a plan',
    description='Creates a pending transaction and Palzio checkout token.',
    request=PurchaseRequest,
    responses={201: PurchaseResponse, 400: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse},
)

schema_subscription_status = extend_schema(
    tags=['Subscriptions'],
    summary='Subscription entitlements summary',
    responses={200: SubscriptionStatusResponse},
)

schema_subscription_me_list = extend_schema(
    tags=['Subscriptions'],
    summary='My subscription history',
    responses={200: UserSubscriptionSerializer(many=True)},
)

schema_subscription_me_detail = extend_schema(
    tags=['Subscriptions'],
    summary='Cancel my subscription',
    request=CancelSubscriptionRequest,
    responses={200: UserSubscriptionSerializer, 400: ErrorResponse},
)

def schema_subscription_plans_manage_collection(view):
    view = extend_schema(
        tags=['Subscriptions (Staff)'],
        methods=['GET'],
        summary='List all plans (staff)',
        responses={200: SubscriptionPlanManageSerializer(many=True)},
    )(view)
    return extend_schema(
        tags=['Subscriptions (Staff)'],
        methods=['POST'],
        summary='Create plan (staff)',
        request=SubscriptionPlanManageSerializer,
        responses={201: SubscriptionPlanManageSerializer, 400: ErrorResponse},
    )(view)

schema_subscription_plans_manage_detail = extend_schema(
    tags=['Subscriptions (Staff)'],
    summary='Update plan (staff)',
    request=SubscriptionPlanManageSerializer,
    responses={200: SubscriptionPlanManageSerializer, 400: ErrorResponse},
)

schema_list_streams = extend_schema(
    tags=['Streaming'],
    summary='List streams',
    parameters=[
        OpenApiParameter('category', str),
        OpenApiParameter('is_live', bool, description='true or false'),
    ],
    responses={200: StreamingContentSerializer(many=True)},
    auth=[],
)

schema_get_stream = extend_schema(
    tags=['Streaming'],
    summary='Stream details',
    responses={200: StreamingContentSerializer, 404: ErrorResponse},
    auth=[],
)

schema_access_stream = extend_schema(
    tags=['Streaming'],
    summary='Get signed stream URL',
    description='Requires paid streaming entitlement or unused free trial.',
    request=None,
    responses={200: StreamAccessResponse, 403: ErrorResponse, 404: ErrorResponse},
)

schema_start_trial = extend_schema(
    tags=['Trial'],
    summary='Start free trial',
    request=inline_serializer(
        name='StartTrialRequest',
        fields={'content_id': serializers.UUIDField()},
    ),
    responses={200: StreamAccessResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse},
)

schema_payment_webhook = extend_schema(
    tags=['Payments'],
    summary='Payment provider webhook',
    description='HMAC-signed callback; updates pending checkout transaction. No JWT — use X-Signature.',
    request=PaymentWebhookRequest,
    responses={200: OpenApiResponse(description='Processed'), 400: ErrorResponse, 401: ErrorResponse, 404: ErrorResponse},
    auth=[],
    parameters=[
        OpenApiParameter(
            'X-Signature',
            str,
            location=OpenApiParameter.HEADER,
            description='HMAC-SHA256 hex of canonical JSON body',
        ),
    ],
)

schema_payment_demo_confirm = extend_schema(
    tags=['Payments'],
    summary='Demo confirm payment (DEBUG only)',
    request=DemoConfirmRequest,
    responses={200: OpenApiResponse(description='Subscription activated'), 403: ErrorResponse, 404: ErrorResponse},
)

schema_payment_history = extend_schema(
    tags=['Payments'],
    summary='Payment history',
    responses={200: TransactionSerializer(many=True)},
)

schema_list_games = extend_schema(
    tags=['Games'],
    summary='List games',
    responses={200: GameSerializer(many=True), 403: ErrorResponse},
)

schema_get_game = extend_schema(
    tags=['Games'],
    summary='Game details',
    responses={200: GameSerializer, 403: ErrorResponse, 404: ErrorResponse},
)

schema_launch_game = extend_schema(
    tags=['Games'],
    summary='Launch game session',
    request=None,
    responses={200: LaunchGameResponse, 403: ErrorResponse, 404: ErrorResponse},
)
