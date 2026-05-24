import logging
import uuid
from datetime import timedelta

from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from entertainment_platform.models import User
from entertainment_platform.permissions import IsPlatformStaff

from .constants import next_tier_info
from .exceptions import XPError, XPDuplicateRequestError
from .models import XPEvent, XPRule, XPTransaction, UserXPWallet
from .permissions import IsXPAdmin
from .response import xp_error, xp_success
from .serializers import (
    RedeemSerializer,
    ReverseTransactionSerializer,
    TriggerEventSerializer,
    XPRuleCreateSerializer,
    XPRuleSerializer,
    XPTransactionSerializer,
)
from .services.engine import get_or_create_wallet, redeem_xp, reverse_transaction, trigger_xp_event
from .openapi import (
    schema_admin_reverse,
    schema_balance,
    schema_leaderboard,
    schema_redeem,
    schema_rules_collection,
    schema_rules_detail,
    schema_transactions,
    schema_trigger_event,
)

logger = logging.getLogger(__name__)


def _request_id(request):
    rid = request.headers.get('X-Request-Id') or str(uuid.uuid4())
    request.request_id = rid
    return rid


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _handle_xp_errors(request, fn):
    try:
        return fn()
    except XPDuplicateRequestError as exc:
        return xp_success(request, exc.details, status=200)
    except XPError as exc:
        return xp_error(
            request,
            exc.code,
            exc.message,
            details=exc.details,
            status=exc.http_status,
        )


def _resolve_target_user(request, user_id_param):
    if user_id_param:
        target = get_object_or_404(User, pk=user_id_param)
        if str(target.id) != str(request.user.id) and getattr(request.user, 'role', '') != 'staff':
            return None, xp_error(request, 'XP_FORBIDDEN', 'Cannot access another user wallet', status=403)
        return target, None
    return request.user, None


@schema_trigger_event
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_event(request):
    """
    POST /api/v1/xp/trigger-event
    Primary pipeline to credit XP for a user action.
    """
    ser = TriggerEventSerializer(data=request.data)
    if not ser.is_valid():
        return xp_error(request, 'XP_VALIDATION_ERROR', 'Invalid request body', details=ser.errors, status=400)

    data = ser.validated_data
    if str(data['user_id']) != str(request.user.id) and getattr(request.user, 'role', '') != 'staff':
        return xp_error(request, 'XP_FORBIDDEN', 'Cannot trigger XP for another user', status=403)

    rid = _request_id(request)

    def run():
        result = trigger_xp_event(
            event_code=data['event_code'],
            user_id=data['user_id'],
            idempotency_key=data['idempotency_key'],
            occurred_at=data['occurred_at'],
            source_metadata=data.get('source_metadata'),
            unit_count=data.get('unit_count', 1),
            request_id=rid,
            source_ip=_client_ip(request),
        )
        return xp_success(request, result)

    return _handle_xp_errors(request, run)


@schema_balance
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def balance(request):
    """
    GET /api/v1/xp/balance?user_id=<uuid>
    """
    user_id = request.query_params.get('user_id')
    target, err = _resolve_target_user(request, user_id)
    if err:
        return err

    wallet = get_or_create_wallet(target)
    next_tier, xp_to_next = next_tier_info(wallet.xp_tier)
    if xp_to_next is not None:
        xp_to_next = max(0, xp_to_next - wallet.total_xp_earned)

    soon = timezone.now() + timedelta(days=30)
    expiring = (
        XPTransaction.objects.filter(
            user=target,
            transaction_type='credit',
            status='confirmed',
            is_expired=False,
            expires_at__isnull=False,
            expires_at__lte=soon,
            expires_at__gt=timezone.now(),
        )
        .order_by('expires_at')[:20]
    )

    return xp_success(request, {
        'user_id': str(target.id),
        'available_xp': wallet.available_xp,
        'total_xp_earned': wallet.total_xp_earned,
        'redeemed_xp': wallet.redeemed_xp,
        'expired_xp': wallet.expired_xp,
        'current_tier': wallet.xp_tier.upper(),
        'next_tier': next_tier.upper() if next_tier else None,
        'xp_to_next_tier': xp_to_next,
        'expiring_soon': [
            {'xp_amount': t.xp_amount, 'expires_at': t.expires_at.isoformat().replace('+00:00', 'Z')}
            for t in expiring
        ],
    })


class XPTransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'per_page'
    max_page_size = 100


@schema_transactions
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transactions(request):
    """
    GET /api/v1/xp/transactions
    """
    user_id = request.query_params.get('user_id')
    if not user_id:
        return xp_error(request, 'XP_VALIDATION_ERROR', 'user_id is required', status=400)

    target, err = _resolve_target_user(request, user_id)
    if err:
        return err

    qs = XPTransaction.objects.filter(user=target).select_related('event', 'rule')

    txn_type = request.query_params.get('transaction_type')
    if txn_type:
        qs = qs.filter(transaction_type=txn_type.lower())

    category = request.query_params.get('category')
    if category:
        qs = qs.filter(event__category=category.lower())

    from_date = request.query_params.get('from_date')
    to_date = request.query_params.get('to_date')
    if from_date:
        qs = qs.filter(created_at__gte=from_date)
    if to_date:
        qs = qs.filter(created_at__lte=to_date)

    paginator = XPTransactionPagination()
    page = paginator.paginate_queryset(qs, request)
    ser = XPTransactionSerializer(page, many=True)
    return xp_success(request, {
        'items': ser.data,
        'page': paginator.page.number,
        'per_page': paginator.get_page_size(request),
        'total': paginator.page.paginator.count,
    })


@schema_redeem
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def redeem(request):
    """
    POST /api/v1/xp/redeem
    """
    ser = RedeemSerializer(data=request.data)
    if not ser.is_valid():
        return xp_error(request, 'XP_VALIDATION_ERROR', 'Invalid request body', details=ser.errors, status=400)

    data = ser.validated_data
    if str(data['user_id']) != str(request.user.id):
        return xp_error(request, 'XP_FORBIDDEN', 'Cannot redeem for another user', status=403)

    rid = _request_id(request)

    def run():
        result = redeem_xp(
            user_id=data['user_id'],
            redemption_item_id=data['redemption_item_id'],
            xp_cost=data['xp_cost'],
            idempotency_key=data['idempotency_key'],
        )
        return xp_success(request, result)

    return _handle_xp_errors(request, run)


@schema_rules_collection
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rules_collection(request):
    """
    GET /api/v1/xp/rules — list rules
    POST /api/v1/xp/rules — create rule (staff)
    """
    if request.method == 'GET':
        qs = XPRule.objects.select_related('event').all()
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(event__category=category.lower())
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ('true', '1', 'yes'))
        ser = XPRuleSerializer(qs, many=True)
        return xp_success(request, {'items': ser.data, 'count': len(ser.data)})

    if not IsPlatformStaff().has_permission(request, None):
        return xp_error(request, 'XP_FORBIDDEN', 'Staff role required', status=403)

    ser = XPRuleCreateSerializer(data=request.data, context={'request': request})
    if not ser.is_valid():
        return xp_error(request, 'XP_VALIDATION_ERROR', 'Invalid rule', details=ser.errors, status=400)
    rule = ser.save()
    return xp_success(request, XPRuleSerializer(rule).data, status=201)


@schema_rules_detail
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def rules_detail(request, rule_id):
    """
    GET/PATCH/DELETE /api/v1/xp/rules/<id>
    """
    rule = get_object_or_404(XPRule.objects.select_related('event'), pk=rule_id)

    if request.method == 'GET':
        return xp_success(request, XPRuleSerializer(rule).data)

    if not IsPlatformStaff().has_permission(request, None):
        return xp_error(request, 'XP_FORBIDDEN', 'Staff role required', status=403)

    if request.method == 'DELETE':
        if rule.transactions.exists():
            rule.is_active = False
            rule.save(update_fields=['is_active', 'updated_at'])
            return xp_success(request, {'id': str(rule.id), 'is_active': False, 'soft_deleted': True})
        rule.delete()
        return xp_success(request, {'id': str(rule.id), 'deleted': True})

    ser = XPRuleSerializer(rule, data=request.data, partial=True)
    if not ser.is_valid():
        return xp_error(request, 'XP_VALIDATION_ERROR', 'Invalid update', details=ser.errors, status=400)
    ser.save()
    return xp_success(request, ser.data)


@schema_admin_reverse
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsXPAdmin])
def admin_reverse(request):
    """
    POST /api/v1/xp/admin/reverse
    """
    ser = ReverseTransactionSerializer(data=request.data)
    if not ser.is_valid():
        return xp_error(request, 'XP_VALIDATION_ERROR', 'Invalid request', details=ser.errors, status=400)

    data = ser.validated_data
    rid = _request_id(request)

    def run():
        result = reverse_transaction(
            transaction_id=data['transaction_id'],
            reason=data['reason'],
            admin_user=request.user,
            admin_note=data.get('admin_note', ''),
            request_id=rid,
        )
        return xp_success(request, result)

    return _handle_xp_errors(request, run)


@schema_leaderboard
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """
    GET /api/v1/xp/leaderboard
    """
    period = request.query_params.get('period', 'all_time')
    category = request.query_params.get('category')
    limit = min(int(request.query_params.get('limit', 100)), 500)
    user_id = request.query_params.get('user_id')

    qs = XPTransaction.objects.filter(
        transaction_type__in=('credit', 'bonus'),
        status='confirmed',
    )
    if category and category.lower() != 'overall':
        qs = qs.filter(event__category=category.lower())

    now = timezone.now()
    if period == 'daily':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        qs = qs.filter(created_at__gte=start)
    elif period == 'weekly':
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        qs = qs.filter(created_at__gte=start)
    elif period == 'monthly':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        qs = qs.filter(created_at__gte=start)

    rows = (
        qs.values('user_id')
        .annotate(total_xp=Sum('xp_amount'))
        .order_by('-total_xp')[:limit]
    )

    entries = []
    user_rank = None
    for idx, row in enumerate(rows, start=1):
        entry = {
            'rank': idx,
            'user_id': str(row['user_id']),
            'total_xp': int(row['total_xp'] or 0),
        }
        entries.append(entry)
        if user_id and str(row['user_id']) == str(user_id):
            user_rank = entry

    if user_id and user_rank is None:
        user_total = qs.filter(user_id=user_id).aggregate(s=Sum('xp_amount'))['s'] or 0
        user_rank = {
            'rank': None,
            'user_id': str(user_id),
            'total_xp': int(user_total),
            'note': 'outside_top_n',
        }

    return xp_success(request, {
        'period': period,
        'category': category or 'overall',
        'entries': entries,
        'user_rank': user_rank,
    })
