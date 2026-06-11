# entertainment_platform/views.py
# API Views for Entertainment Platform

from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from datetime import timedelta
import random
import string
import uuid
import hmac
import hashlib
import logging

from .models import (
    User, OTPRequest, SubscriptionPlan, UserSubscription,
    Transaction, StreamingContent, StreamSession, Game, GameSession, AuditLog
)
from .serializers import (
    UserSerializer, SendOTPSerializer, VerifyOTPSerializer,
    SubscriptionPlanSerializer, UserSubscriptionSerializer,
    TransactionSerializer, StreamingContentSerializer,
    StreamSessionSerializer, GameSerializer, GameSessionSerializer
)
from .utils import send_sms_otp, generate_signed_url, validate_payment_signature

logger = logging.getLogger(__name__)


# ============================================================================
# AUTHENTICATION VIEWS
# ============================================================================

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
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Audit log
    AuditLog.objects.create(
        module='auth',
        action='otp_verified',
        actor_user=user,
        ip_address=get_client_ip(request),
        metadata={'phone_number': phone_number}
    )
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


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

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update user profile
    GET /api/v1/users/me
    PUT /api/v1/users/me
    """
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Only allow updating specific fields
        allowed_fields = ['phone_number']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# SUBSCRIPTION VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def list_plans(request):
    """
    List available subscription plans
    GET /api/v1/subscriptions/plans
    """
    plans = SubscriptionPlan.objects.filter(status='active')
    serializer = SubscriptionPlanSerializer(plans, many=True)
    return Response(serializer.data)


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
    
    # Create transaction
    transaction_ref = str(uuid.uuid4())
    txn = Transaction.objects.create(
        user=user,
        transaction_ref=transaction_ref,
        amount=plan.price_afn,
        currency='AFN',
        status='pending',
        payment_method='wallet'
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
        'amount': str(plan.price_afn),
        'currency': 'AFN',
        'redirect_url': f'/checkout/{transaction_ref}'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """
    Get user's active subscription status
    GET /api/v1/subscriptions/status
    """
    user = request.user
    subscription = user.user_subscriptions.filter(
        status='active',
        end_at__gt=timezone.now()
    ).first()
    
    if subscription:
        serializer = UserSubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    return Response({
        'has_active_subscription': False,
        'can_use_trial': user.can_use_free_trial()
    }, status=status.HTTP_200_OK)


# ============================================================================
# STREAMING VIEWS
# ============================================================================

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
    
    # Check for active subscription
    subscription = user.user_subscriptions.filter(
        status='active',
        end_at__gt=timezone.now()
    ).first()
    
    if subscription:
        # User has active subscription - grant full access
        session_type = 'paid'
        expires_in = subscription.end_at
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

@api_view(['POST'])
@permission_classes([AllowAny])
def payment_webhook(request):
    """
    Handle payment provider webhook callback
    POST /api/v1/payments/webhook
    """
    signature = request.headers.get('X-Signature')
    transaction_ref = request.data.get('transaction_ref')
    provider_ref = request.data.get('provider_ref')
    payment_status = request.data.get('status')
    
    # Validate signature (implement with your payment provider)
    if not validate_payment_signature(request.data, signature):
        return Response(
            {'error': 'Invalid signature'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        txn = Transaction.objects.get(transaction_ref=transaction_ref)
    except Transaction.DoesNotExist:
        return Response(
            {'error': 'Transaction not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update transaction
    txn.provider_ref = provider_ref
    txn.provider_response = request.data
    
    if payment_status == 'success':
        txn.status = 'success'
        txn.save()
        
        # Create subscription
        with transaction.atomic():
            # Get plan (for now, use the cheapest plan)
            plan = SubscriptionPlan.objects.filter(status='active').first()
            if plan:
                subscription = UserSubscription.objects.create(
                    user=txn.user,
                    plan=plan,
                    status='active',
                    start_at=timezone.now(),
                    end_at=timezone.now() + timedelta(hours=plan.duration_hours)
                )
                txn.subscription = subscription
                txn.save()
        
        AuditLog.objects.create(
            module='payment',
            action='payment_success',
            actor_user=txn.user,
            metadata={'transaction_ref': transaction_ref}
        )
    else:
        txn.status = 'failed'
        txn.save()
        
        AuditLog.objects.create(
            module='payment',
            action='payment_failed',
            actor_user=txn.user,
            metadata={'transaction_ref': transaction_ref}
        )
    
    return Response({'message': 'Webhook processed'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    """
    Get user's payment history
    GET /api/v1/payments/history
    """
    transactions = Transaction.objects.filter(user=request.user).order_by('-created_at')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


# ============================================================================
# GAMES VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_games(request):
    """
    List available games
    GET /api/v1/games
    """
    user = request.user
    
    # Check if user has active subscription
    has_subscription = user.has_active_subscription()
    
    if not has_subscription:
        return Response(
            {'error': 'No active subscription'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    games = Game.objects.filter(status='active')
    serializer = GameSerializer(games, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_game(request, game_id):
    """
    Get game details
    GET /api/v1/games/{id}
    """
    user = request.user
    
    if not user.has_active_subscription():
        return Response(
            {'error': 'No active subscription'},
            status=status.HTTP_403_FORBIDDEN
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def launch_game(request, game_id):
    """
    Launch game and get session token
    POST /api/v1/games/{id}/launch
    """
    user = request.user
    
    if not user.has_active_subscription():
        return Response(
            {'error': 'No active subscription'},
            status=status.HTTP_403_FORBIDDEN
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
