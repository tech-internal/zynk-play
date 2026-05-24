# entertainment_platform/views.py
# API Views for Entertainment Platform

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from datetime import timedelta
import json
import random
import string
import uuid
import logging

from .models import (
    User, OTPRequest, SubscriptionPlan, UserSubscription,
    Transaction, StreamingContent, StreamSession, Game, GameSession, AuditLog
)
from .serializers import (
    UserSerializer, SendOTPSerializer, VerifyOTPSerializer,
    SubscriptionPlanSerializer, SubscriptionPlanManageSerializer,
    UserSubscriptionSerializer,
    TransactionSerializer, StreamingContentSerializer,
    StreamSessionSerializer, GameSerializer, GameSessionSerializer,
)
from .tokens import issue_tokens_for_platform_user
from .subscriptions import (
    create_user_subscription_from_paid_transaction,
    eligible_active_plan_ids,
    purchase_eligibility_reason,
)
from .permissions import IsPlatformStaff
from .utils import send_sms_otp, generate_signed_url, validate_payment_signature
from .palzio_tokens import issue_palzio_checkout_token
from .openapi import (
    schema_access_stream,
    schema_get_game,
    schema_get_stream,
    schema_home,
    schema_launch_game,
    schema_list_games,
    schema_list_plans,
    schema_list_streams,
    schema_mock_send_otp,
    schema_mock_verify_otp,
    schema_payment_demo_confirm,
    schema_payment_history,
    schema_payment_webhook,
    schema_purchase_subscription,
    schema_refresh_token,
    schema_send_otp,
    schema_start_trial,
    schema_subscription_me_detail,
    schema_subscription_me_list,
    schema_subscription_plans_manage_collection,
    schema_subscription_plans_manage_detail,
    schema_subscription_status,
    schema_user_profile,
    schema_verify_otp,
)

logger = logging.getLogger(__name__)


# ============================================================================
# HOME & DOCUMENTATION
# ============================================================================

@schema_home
@api_view(['GET'])
@permission_classes([AllowAny])
def home(request):
    """
    API Home - Shows available endpoints
    GET /
    """
    return Response({
        "name": "Entertainment Platform API",
        "version": "1.0.0",
        "description": "Complete entertainment platform with OTP auth, subscriptions, streaming, and gaming",
        "endpoints": {
            "admin": "http://localhost:8000/admin/ - Django Admin Dashboard",
            "auth": {
                "send_otp": "POST /api/v1/auth/send-otp - Send OTP to phone",
                "verify_otp": "POST /api/v1/auth/verify-otp - Verify OTP and get JWT",
                "refresh": "POST /api/v1/auth/refresh - Refresh access token"
            },
            "mock_auth": {
                "send_otp": "POST /api/v1/mock/auth/send-otp - Mock: always responds as if OTP was sent",
                "verify_otp": "POST /api/v1/mock/auth/verify-otp - Mock: success when otp_code is 123456"
            },
            "subscriptions": {
                "plans": "GET /api/v1/subscriptions/plans - List subscription plans",
                "purchase": "POST /api/v1/subscriptions/purchase - Purchase plan",
                "status": "GET /api/v1/subscriptions/status - Get user subscription"
            },
            "streaming": {
                "list": "GET /api/v1/streams - List streaming content",
                "detail": "GET /api/v1/streams/<id> - Get stream details",
                "access": "POST /api/v1/streams/<id>/access - Get signed access URL",
                "trial": "POST /api/v1/trial/start - Start 5-minute free trial"
            },
            "gaming": {
                "list": "GET /api/v1/games - List games",
                "detail": "GET /api/v1/games/<id> - Get game details",
                "launch": "POST /api/v1/games/<id>/launch - Launch game"
            },
            "payments": {
                "webhook": "POST /api/v1/payments/webhook - Payment notifications",
                "history": "GET /api/v1/payments/history - Transaction history"
            },
            "palzio_psp_mock": {
                "complete": "POST /psp/api/v1/complete/ - Mock Palzio PSP forwards result to payments/webhook"
            }
        },
        "admin_credentials": {
            "username": "admin",
            "password": "admin123",
            "url": "http://localhost:8000/admin/"
        },
        "documentation": {
            "openapi_schema": "/api/schema/",
            "swagger_ui": "/api/docs/",
            "redoc": "/api/redoc/",
            "architecture": "See docs/ARCHITECTURE.md",
            "development": "See docs/DEVELOPMENT.md",
            "readme": "See README.md"
        }
    })


# ============================================================================
# AUTHENTICATION VIEWS
# ============================================================================

@schema_send_otp
@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Send OTP to phone number
    POST /api/v1/auth/send-otp
    """
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    phone_number = serializer.validated_data['phone_number']
    
    # Check rate limiting - allow 3 OTP requests per 5 minutes
    cache_key = f"otp_attempts:{phone_number}"
    attempts = cache.get(cache_key, 0)
    if attempts >= 3:
        return Response(
            {'error': 'Too many OTP requests. Try again in 5 minutes.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    # Generate OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    otp_hash = OTPRequest.hash_otp(otp_code)
    
    # Store in database
    otp_obj = OTPRequest.objects.create(
        phone_number=phone_number,
        otp_code_hash=otp_hash,
        expires_at=timezone.now() + timedelta(minutes=5),
        status='pending'
    )
    
    # Cache for quick cooldown check
    cache.set(f"otp:{phone_number}", otp_code, 300)  # 5 minutes
    
    # Send SMS (implement with your SMS provider)
    try:
        send_sms_otp(phone_number, otp_code)
        cache.incr(cache_key)
        cache.expire(cache_key, 300)  # 5 minutes
    except Exception as e:
        logger.error(f"Failed to send OTP: {e}")
        return Response(
            {'error': 'Failed to send OTP. Try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        'message': 'OTP sent successfully',
        'expires_in_seconds': 300
    }, status=status.HTTP_200_OK)


@schema_verify_otp
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP and return JWT tokens
    POST /api/v1/auth/verify-otp
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    phone_number = serializer.validated_data['phone_number']
    otp_code = serializer.validated_data['otp_code']
    
    # Get latest OTP request
    otp_request = OTPRequest.objects.filter(
        phone_number=phone_number,
        status='pending'
    ).order_by('-created_at').first()
    
    if not otp_request:
        return Response(
            {'error': 'No OTP request found'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify OTP
    if not otp_request.verify_otp(otp_code):
        return Response(
            {'error': 'Invalid OTP'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create or get user
    user, created = User.objects.get_or_create(phone_number=phone_number)
    user.last_login_at = timezone.now()
    user.save()
    
    _refresh, access, refresh_str = issue_tokens_for_platform_user(user)

    # Audit log
    AuditLog.objects.create(
        module='auth',
        action='otp_verified',
        actor_user=user,
        ip_address=get_client_ip(request),
        metadata={'phone_number': phone_number}
    )

    return Response({
        'access': access,
        'refresh': refresh_str,
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


@schema_mock_send_otp
@api_view(['POST'])
@permission_classes([AllowAny])
def mock_send_otp(request):
    """
    Mock OTP send — no SMS; always reports success.
    POST /api/v1/mock/auth/send-otp
    Body: { "phone_number": "+93..." }
    """
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(
        {'message': 'OTP has been sent'},
        status=status.HTTP_200_OK,
    )


@schema_mock_verify_otp
@api_view(['POST'])
@permission_classes([AllowAny])
def mock_verify_otp(request):
    """
    Mock OTP verify — succeeds only when otp_code is 123456.
    POST /api/v1/mock/auth/verify-otp
    Body: { "phone_number": "...", "otp_code": "123456" }
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    otp_code = serializer.validated_data['otp_code']
    phone_number = serializer.validated_data['phone_number']

    if otp_code != '123456':
        return Response(
            {'error': 'Invalid OTP', 'success': False},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user, _created = User.objects.get_or_create(phone_number=phone_number)
    user.last_login_at = timezone.now()
    user.save(update_fields=['last_login_at', 'updated_at'])
    _refresh, access, refresh_str = issue_tokens_for_platform_user(user)

    AuditLog.objects.create(
        module='auth',
        action='mock_otp_verified',
        actor_user=user,
        ip_address=get_client_ip(request),
        metadata={'phone_number': phone_number},
    )

    return Response(
        {
            'message': 'Login successful',
            'success': True,
            'phone_number': phone_number,
            'access': access,
            'refresh': refresh_str,
            'user': UserSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


@schema_refresh_token
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh JWT token
    POST /api/v1/auth/refresh
    """
    refresh = request.data.get('refresh')
    if not refresh:
        return Response(
            {'error': 'Refresh token required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        token = RefreshToken(refresh)
        return Response({
            'access': str(token.access_token)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================================
# USER VIEWS
# ============================================================================

@schema_user_profile
@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update user profile
    GET /api/v1/users/me
    PUT|PATCH /api/v1/users/me — username, full_name, email, country (mobile is read-only from OTP)
    """
    user = request.user

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    if request.method in ('PUT', 'PATCH'):
        allowed_fields = ['username', 'full_name', 'email', 'country', 'languages']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = UserSerializer(user, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            serializer.save()
        except IntegrityError:
            return Response(
                {'username': ['This username is already taken.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
# SUBSCRIPTION VIEWS
# ============================================================================

@schema_list_plans
@api_view(['GET'])
@permission_classes([AllowAny])
def list_plans(request):
    """
    List available subscription plans
    GET /api/v1/subscriptions/plans
    Optional query: billing_period, entitlement_type
    """
    plans = SubscriptionPlan.objects.filter(status='active')
    if request.query_params.get('eligible_for_me') == '1':
        if not isinstance(request.user, User):
            return Response(
                {'error': 'Authentication required', 'code': 'AUTH_REQUIRED'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        plans = plans.filter(pk__in=eligible_active_plan_ids(request.user))
    bp = request.query_params.get('billing_period')
    et = request.query_params.get('entitlement_type')
    if bp:
        plans = plans.filter(billing_period=bp)
    if et:
        plans = plans.filter(entitlement_type=et)
    serializer = SubscriptionPlanSerializer(
        plans.order_by('billing_period', 'entitlement_type'),
        many=True,
        context={'request': request},
    )
    return Response(serializer.data)


@schema_purchase_subscription
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_subscription(request):
    """
    Purchase subscription plan
    POST /api/v1/subscriptions/purchase
    """
    user = request.user
    plan_id = request.data.get('plan_id')
    
    if not plan_id:
        return Response(
            {'error': 'plan_id required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        plan = SubscriptionPlan.objects.get(id=plan_id, status='active')
    except SubscriptionPlan.DoesNotExist:
        return Response(
            {'error': 'Plan not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    block_reason = purchase_eligibility_reason(user, plan)
    if block_reason:
        return Response(
            {'error': block_reason, 'code': 'PURCHASE_NOT_ELIGIBLE'},
            status=status.HTTP_409_CONFLICT,
        )

    # Create transaction
    transaction_ref = str(uuid.uuid4())
    txn = Transaction.objects.create(
        user=user,
        plan=plan,
        transaction_ref=transaction_ref,
        amount=plan.price_afn,
        currency='AFN',
        status='pending',
        payment_method='palzio_mock',
    )

    checkout_token = issue_palzio_checkout_token(
        transaction_ref=transaction_ref,
        user_id=str(user.id),
        amount=str(plan.price_afn),
        currency='AFN',
        plan_name=plan.name,
    )

    # Audit log
    AuditLog.objects.create(
        module='subscription',
        action='purchase_initiated',
        actor_user=user,
        metadata={'plan_id': str(plan_id), 'transaction_ref': transaction_ref}
    )

    return Response({
        'transaction_ref': transaction_ref,
        'plan_id': str(plan.id),
        'amount': str(plan.price_afn),
        'currency': 'AFN',
        'plan_name': plan.name,
        'checkout_token': checkout_token,
        'palzio_checkout_path': '/pay/palzio',
        'redirect_url': f'/pay/palzio?transaction_ref={transaction_ref}&checkout_token={checkout_token}',
        'demo_complete_hint': 'POST /api/v1/payments/demo-confirm with transaction_ref when DEBUG=True',
    }, status=status.HTTP_201_CREATED)


@schema_subscription_status
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """
    Entitlements summary + active subscriptions
    GET /api/v1/subscriptions/status
    """
    user = request.user
    active = user.user_subscriptions.filter(status='active', end_at__gt=timezone.now()).order_by('-end_at')
    data = {
        'has_active_subscription': active.exists(),
        'has_game_entitlement': user.has_game_entitlement(),
        'has_streaming_entitlement': user.has_streaming_entitlement(),
        'can_use_trial': user.can_use_free_trial(),
        'active_subscriptions': UserSubscriptionSerializer(active, many=True).data,
        'eligible_plan_ids': eligible_active_plan_ids(user),
    }
    return Response(data, status=status.HTTP_200_OK)


@schema_subscription_me_list
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_me_list(request):
    """Full subscription history for the signed-in account (mobile identity)."""
    subs = request.user.user_subscriptions.all().order_by('-created_at')
    return Response(UserSubscriptionSerializer(subs, many=True).data)


@schema_subscription_me_detail
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def subscription_me_detail(request, subscription_id):
    """Cancel own subscription (soft revoke — marks cancelled, access until end_at if you extend logic)."""
    sub = get_object_or_404(UserSubscription, id=subscription_id, user=request.user)
    new_status = request.data.get('status')
    if new_status != 'cancelled':
        return Response(
            {'error': 'Only status=cancelled is supported for self-service updates.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    sub.status = 'cancelled'
    sub.save(update_fields=['status', 'updated_at'])
    AuditLog.objects.create(
        module='subscription',
        action='subscription_cancelled',
        actor_user=request.user,
        ip_address=get_client_ip(request),
        metadata={'subscription_id': str(sub.id)},
    )
    return Response(UserSubscriptionSerializer(sub).data)


@schema_subscription_plans_manage_collection
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsPlatformStaff])
def subscription_plans_manage_collection(request):
    """
    Staff: list all plans (any status) or create a new catalog plan.
    """
    if request.method == 'GET':
        plans = SubscriptionPlan.objects.all().order_by('status', 'billing_period', 'entitlement_type')
        return Response(SubscriptionPlanManageSerializer(plans, many=True).data)
    serializer = SubscriptionPlanManageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    plan = serializer.save()
    AuditLog.objects.create(
        module='subscription',
        action='plan_created',
        actor_user=request.user,
        metadata={'plan_id': str(plan.id)},
    )
    return Response(SubscriptionPlanManageSerializer(plan).data, status=status.HTTP_201_CREATED)


@schema_subscription_plans_manage_detail
@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsPlatformStaff])
def subscription_plans_manage_detail(request, plan_id):
    """Staff: update an existing catalog plan (price, duration, status, etc.)."""
    plan = get_object_or_404(SubscriptionPlan, id=plan_id)
    serializer = SubscriptionPlanManageSerializer(plan, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    AuditLog.objects.create(
        module='subscription',
        action='plan_updated',
        actor_user=request.user,
        metadata={'plan_id': str(plan.id)},
    )
    return Response(SubscriptionPlanManageSerializer(plan).data)


# ============================================================================
# STREAMING VIEWS
# ============================================================================

@schema_list_streams
@api_view(['GET'])
@permission_classes([AllowAny])
def list_streams(request):
    """
    List available streaming content
    GET /api/v1/streams
    """
    category = request.query_params.get('category')
    is_live = request.query_params.get('is_live')
    
    queryset = StreamingContent.objects.filter(status='active')
    
    if category:
        queryset = queryset.filter(category=category)
    
    if is_live:
        queryset = queryset.filter(is_live=is_live.lower() == 'true')
    
    serializer = StreamingContentSerializer(queryset, many=True)
    return Response(serializer.data)


@schema_get_stream
@api_view(['GET'])
@permission_classes([AllowAny])
def get_stream(request, stream_id):
    """
    Get stream details
    GET /api/v1/streams/{id}
    """
    try:
        stream = StreamingContent.objects.get(id=stream_id, status='active')
    except StreamingContent.DoesNotExist:
        return Response(
            {'error': 'Stream not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = StreamingContentSerializer(stream)
    return Response(serializer.data)


@schema_access_stream
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def access_stream(request, stream_id):
    """
    Request access to stream (trial or paid)
    POST /api/v1/streams/{id}/access
    """
    user = request.user
    
    try:
        content = StreamingContent.objects.get(id=stream_id, status='active')
    except StreamingContent.DoesNotExist:
        return Response(
            {'error': 'Stream not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    paid_sub = (
        user.user_subscriptions.filter(
            status='active',
            end_at__gt=timezone.now(),
            entitlement_type__in=('streaming_only', 'game_and_streaming'),
        )
        .order_by('-end_at')
        .first()
    )

    if paid_sub:
        session_type = 'paid'
        expires_in = paid_sub.end_at
    elif user.can_use_free_trial():
        # Grant 5-minute trial
        session_type = 'trial'
        expires_in = timezone.now() + timedelta(minutes=5)
    else:
        return Response(
            {'error': 'No active subscription and trial already used'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Create stream session
    session = StreamSession.objects.create(
        user=user,
        content=content,
        session_type=session_type,
        expires_at=expires_in,
        signed_url=generate_signed_url(str(content.id), str(user.id))
    )
    
    # Mark trial as used
    if session_type == 'trial':
        user.free_trial_used = True
        user.free_trial_used_at = timezone.now()
        user.save()
    
    # Audit log
    AuditLog.objects.create(
        module='streaming',
        action='stream_access_granted',
        actor_user=user,
        metadata={'content_id': str(stream_id), 'session_type': session_type}
    )
    
    return Response({
        'signed_url': session.signed_url,
        'expires_in_seconds': int((expires_in - timezone.now()).total_seconds()),
        'session_id': str(session.id)
    }, status=status.HTTP_200_OK)


# ============================================================================
# TRIAL VIEWS
# ============================================================================

@schema_start_trial
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_trial(request):
    """
    Start 5-minute free trial
    POST /api/v1/trial/start
    """
    user = request.user
    
    if not user.can_use_free_trial():
        return Response(
            {'error': 'Trial already used or account suspended'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_id = request.data.get('content_id')
    if not content_id:
        return Response(
            {'error': 'content_id required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        content = StreamingContent.objects.get(id=content_id)
    except StreamingContent.DoesNotExist:
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Create trial session
    expires_at = timezone.now() + timedelta(minutes=5)
    session = StreamSession.objects.create(
        user=user,
        content=content,
        session_type='trial',
        expires_at=expires_at,
        signed_url=generate_signed_url(str(content.id), str(user.id))
    )
    
    user.free_trial_used = True
    user.free_trial_used_at = timezone.now()
    user.save()
    
    return Response({
        'signed_url': session.signed_url,
        'expires_in_seconds': 300,
        'message': 'Trial started successfully'
    }, status=status.HTTP_200_OK)


# ============================================================================
# PAYMENT VIEWS
# ============================================================================

@schema_payment_webhook
@api_view(['POST'])
@permission_classes([AllowAny])
def payment_webhook(request):
    """
    Handle payment provider webhook callback
    POST /api/v1/payments/webhook

    Updates the **existing** checkout Transaction created at purchase time (same ``transaction_ref``).
    Never creates a new Transaction row here.
    """
    signature = request.headers.get('X-Signature')
    # Plain dict + JSON round-trip so HMAC matches what providers sign and DRF parses consistently.
    try:
        signing_payload = json.loads(json.dumps(dict(request.data), default=str))
    except (TypeError, ValueError):
        signing_payload = dict(request.data)

    if not validate_payment_signature(signing_payload, signature):
        return Response(
            {'error': 'Invalid signature'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    raw_ref = request.data.get('transaction_ref')
    if not raw_ref:
        return Response(
            {'error': 'transaction_ref required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    transaction_ref = str(raw_ref).strip()
    provider_ref = request.data.get('provider_ref')
    payment_status = request.data.get('status')
    payment_method = request.data.get('payment_method')
    provider_snapshot = dict(request.data)

    with transaction.atomic():
        try:
            txn = Transaction.objects.select_for_update().get(transaction_ref=transaction_ref)
        except Transaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if payment_status == 'success' and txn.status == 'success':
            return Response({'message': 'Already processed'}, status=status.HTTP_200_OK)

        if txn.status != 'pending':
            return Response(
                {'error': 'Transaction is not pending', 'status': txn.status},
                status=status.HTTP_400_BAD_REQUEST,
            )

        txn.provider_ref = provider_ref or txn.provider_ref
        txn.provider_response = provider_snapshot
        if payment_method:
            txn.payment_method = str(payment_method)[:50]

        if payment_status == 'success':
            txn.status = 'success'
            txn.save(
                update_fields=[
                    'provider_ref', 'provider_response', 'payment_method', 'status', 'updated_at',
                ]
            )
            if txn.plan_id and not txn.subscription_id:
                create_user_subscription_from_paid_transaction(txn)
            elif not txn.plan_id:
                logger.error('Payment success but transaction %s has no plan', transaction_ref)

            AuditLog.objects.create(
                module='payment',
                action='payment_success',
                actor_user=txn.user,
                metadata={'transaction_ref': transaction_ref}
            )
        elif payment_status == 'user_dropped':
            txn.status = 'cancelled'
            txn.save(
                update_fields=[
                    'provider_ref', 'provider_response', 'payment_method', 'status', 'updated_at',
                ]
            )
            AuditLog.objects.create(
                module='payment',
                action='payment_user_dropped',
                actor_user=txn.user,
                metadata={'transaction_ref': transaction_ref},
            )
        else:
            txn.status = 'failed'
            txn.save(
                update_fields=[
                    'provider_ref', 'provider_response', 'payment_method', 'status', 'updated_at',
                ]
            )
            AuditLog.objects.create(
                module='payment',
                action='payment_failed',
                actor_user=txn.user,
                metadata={'transaction_ref': transaction_ref, 'provider_status': payment_status},
            )

    return Response({'message': 'Webhook processed'}, status=status.HTTP_200_OK)


@schema_payment_demo_confirm
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_demo_confirm(request):
    """
    Mark a pending transaction paid and activate subscription (local DEBUG only).
    POST /api/v1/payments/demo-confirm  { "transaction_ref": "..." }
    """
    if not settings.DEBUG:
        return Response(
            {'error': 'Demo payment confirmation is only enabled when Django DEBUG=True.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    transaction_ref = request.data.get('transaction_ref')
    if not transaction_ref:
        return Response({'error': 'transaction_ref required'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        txn = (
            Transaction.objects.select_for_update()
            .filter(transaction_ref=transaction_ref, user=request.user)
            .first()
        )
        if not txn:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
        if txn.status != 'pending':
            return Response(
                {'error': 'Transaction is not pending', 'status': txn.status},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not txn.plan:
            return Response({'error': 'Transaction has no plan'}, status=status.HTTP_400_BAD_REQUEST)
        txn.status = 'success'
        txn.payment_method = txn.payment_method or 'demo'
        txn.save()
        sub = create_user_subscription_from_paid_transaction(txn)

    AuditLog.objects.create(
        module='payment',
        action='demo_payment_confirmed',
        actor_user=request.user,
        metadata={'transaction_ref': transaction_ref},
    )
    return Response(
        {
            'message': 'Subscription activated',
            'subscription': UserSubscriptionSerializer(sub).data if sub else None,
        },
        status=status.HTTP_200_OK,
    )


@schema_payment_history
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """
    Get user's payment history
    GET /api/v1/payments/history
    """
    transactions = (
        Transaction.objects.filter(user=request.user)
        .select_related('plan')
        .order_by('-created_at')
    )
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


# ============================================================================
# GAMES VIEWS
# ============================================================================

@schema_list_games
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_games(request):
    """
    List available games
    GET /api/v1/games
    """
    user = request.user
    
    if not user.has_game_entitlement():
        return Response(
            {'error': 'No active game subscription', 'code': 'NEED_GAME_SUBSCRIPTION'},
            status=status.HTTP_403_FORBIDDEN,
        )
    
    games = Game.objects.filter(status='active')
    serializer = GameSerializer(games, many=True)
    return Response(serializer.data)


@schema_get_game
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game(request, game_id):
    """
    Get game details
    GET /api/v1/games/{id}
    """
    user = request.user
    
    if not user.has_game_entitlement():
        return Response(
            {'error': 'No active game subscription', 'code': 'NEED_GAME_SUBSCRIPTION'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        game = Game.objects.get(id=game_id, status='active')
    except Game.DoesNotExist:
        return Response(
            {'error': 'Game not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = GameSerializer(game)
    return Response(serializer.data)


@schema_launch_game
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def launch_game(request, game_id):
    """
    Launch game and get session token
    POST /api/v1/games/{id}/launch
    """
    user = request.user
    
    if not user.has_game_entitlement():
        return Response(
            {'error': 'No active game subscription', 'code': 'NEED_GAME_SUBSCRIPTION'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        game = Game.objects.get(id=game_id, status='active')
    except Game.DoesNotExist:
        return Response(
            {'error': 'Game not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Generate session token
    session_token = str(uuid.uuid4())
    
    # Create game session
    game_session = GameSession.objects.create(
        user=user,
        game=game,
        session_token=session_token,
        started_at=timezone.now()
    )
    
    AuditLog.objects.create(
        module='games',
        action='game_launched',
        actor_user=user,
        metadata={'game_id': str(game_id), 'session_id': str(game_session.id)}
    )
    
    return Response({
        'session_token': session_token,
        'game_source': game.game_source
    }, status=status.HTTP_200_OK)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
