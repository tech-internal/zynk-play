"""
OpenAPI schema decorators for XP management views.
"""

from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import serializers

from .serializers import (
    RedeemSerializer,
    ReverseTransactionSerializer,
    TriggerEventSerializer,
    XPRuleCreateSerializer,
    XPRuleSerializer,
    XPTransactionSerializer,
)

# ---------------------------------------------------------------------------
# XP envelope serializers (documented response shape)
# ---------------------------------------------------------------------------

XPMeta = inline_serializer(
    name='XPMeta',
    fields={
        'requestId': serializers.CharField(),
        'timestamp': serializers.CharField(),
    },
)

XPErrorBody = inline_serializer(
    name='XPErrorBody',
    fields={
        'code': serializers.CharField(),
        'message': serializers.CharField(),
        'details': serializers.JSONField(),
    },
)

def xp_success_response(name, data_fields):
    """Build inline serializer for { success, data, meta }."""
    return inline_serializer(
        name=name,
        fields={
            'success': serializers.BooleanField(default=True),
            'data': inline_serializer(name=f'{name}Data', fields=data_fields),
            'meta': XPMeta,
        },
    )


XPBalanceData = inline_serializer(
    name='XPBalanceData',
    fields={
        'user_id': serializers.CharField(),
        'available_xp': serializers.IntegerField(),
        'total_xp_earned': serializers.IntegerField(),
        'redeemed_xp': serializers.IntegerField(),
        'expired_xp': serializers.IntegerField(),
        'current_tier': serializers.CharField(),
        'next_tier': serializers.CharField(allow_null=True),
        'xp_to_next_tier': serializers.IntegerField(allow_null=True),
        'expiring_soon': serializers.ListField(child=serializers.DictField()),
    },
)

XPTransactionsData = inline_serializer(
    name='XPTransactionsData',
    fields={
        'items': XPTransactionSerializer(many=True),
        'page': serializers.IntegerField(),
        'per_page': serializers.IntegerField(),
        'total': serializers.IntegerField(),
    },
)

XPRulesListData = inline_serializer(
    name='XPRulesListData',
    fields={
        'items': XPRuleSerializer(many=True),
        'count': serializers.IntegerField(),
    },
)

XPLeaderboardData = inline_serializer(
    name='XPLeaderboardData',
    fields={
        'period': serializers.CharField(),
        'category': serializers.CharField(),
        'entries': serializers.ListField(child=serializers.DictField()),
        'user_rank': serializers.DictField(allow_null=True),
    },
)

XPErrorEnvelope = inline_serializer(
    name='XPErrorEnvelope',
    fields={
        'success': serializers.BooleanField(default=False),
        'error': XPErrorBody,
        'meta': XPMeta,
    },
)

XPBalanceEnvelope = xp_success_response('XPBalanceEnvelope', {
    'user_id': serializers.CharField(),
    'available_xp': serializers.IntegerField(),
    'total_xp_earned': serializers.IntegerField(),
    'redeemed_xp': serializers.IntegerField(),
    'expired_xp': serializers.IntegerField(),
    'current_tier': serializers.CharField(),
    'next_tier': serializers.CharField(allow_null=True, required=False),
    'xp_to_next_tier': serializers.IntegerField(allow_null=True, required=False),
    'expiring_soon': serializers.ListField(child=serializers.DictField()),
})

XPTransactionsEnvelope = xp_success_response('XPTransactionsEnvelope', {
    'items': XPTransactionSerializer(many=True),
    'page': serializers.IntegerField(),
    'per_page': serializers.IntegerField(),
    'total': serializers.IntegerField(),
})

XPRulesListEnvelope = xp_success_response('XPRulesListEnvelope', {
    'items': XPRuleSerializer(many=True),
    'count': serializers.IntegerField(),
})

XPLeaderboardEnvelope = xp_success_response('XPLeaderboardEnvelope', {
    'period': serializers.CharField(),
    'category': serializers.CharField(),
    'entries': serializers.ListField(child=serializers.DictField()),
    'user_rank': serializers.DictField(allow_null=True, required=False),
})

XPGenericSuccess = inline_serializer(
    name='XPGenericSuccess',
    fields={
        'success': serializers.BooleanField(default=True),
        'data': serializers.JSONField(),
        'meta': XPMeta,
    },
)

# ---------------------------------------------------------------------------
# Decorators
# ---------------------------------------------------------------------------

schema_trigger_event = extend_schema(
    tags=['XP'],
    summary='Trigger XP event',
    description='Credit XP for a user action. Idempotent via `idempotency_key`. Staff may trigger for other users.',
    request=TriggerEventSerializer,
    responses={200: XPGenericSuccess, 400: XPErrorEnvelope, 403: XPErrorEnvelope},
    parameters=[
        OpenApiParameter(
            'X-Request-Id',
            str,
            location=OpenApiParameter.HEADER,
            description='Optional trace id; generated if omitted.',
        ),
    ],
)

schema_balance = extend_schema(
    tags=['XP'],
    summary='XP wallet balance',
    parameters=[
        OpenApiParameter('user_id', str, description='UUID; omit for self. Staff may query others.'),
    ],
    responses={200: XPBalanceEnvelope, 403: XPErrorEnvelope},
)

schema_transactions = extend_schema(
    tags=['XP'],
    summary='XP transaction history',
    parameters=[
        OpenApiParameter('user_id', str, required=True, description='Target user UUID'),
        OpenApiParameter('transaction_type', str, description='credit | debit | redeem | bonus'),
        OpenApiParameter('category', str),
        OpenApiParameter('from_date', str, description='ISO datetime filter'),
        OpenApiParameter('to_date', str, description='ISO datetime filter'),
        OpenApiParameter('page', int),
        OpenApiParameter('per_page', int),
    ],
    responses={200: XPTransactionsEnvelope, 400: XPErrorEnvelope, 403: XPErrorEnvelope},
)

schema_redeem = extend_schema(
    tags=['XP'],
    summary='Redeem XP',
    request=RedeemSerializer,
    responses={200: XPGenericSuccess, 400: XPErrorEnvelope, 403: XPErrorEnvelope},
)

def schema_rules_collection(view):
    view = extend_schema(
        tags=['XP'],
        methods=['GET'],
        operation_id='xp_rules_list',
        summary='List XP rules',
        parameters=[
            OpenApiParameter('category', str),
            OpenApiParameter('is_active', bool),
        ],
        responses={200: XPRulesListEnvelope},
    )(view)
    return extend_schema(
        tags=['XP'],
        methods=['POST'],
        summary='Create XP rule (staff)',
        request=XPRuleCreateSerializer,
        responses={201: XPGenericSuccess, 400: XPErrorEnvelope, 403: XPErrorEnvelope},
    )(view)

def schema_rules_detail(view):
    view = extend_schema(
        tags=['XP'],
        methods=['GET'],
        operation_id='xp_rules_retrieve',
        summary='Get XP rule',
        responses={200: XPGenericSuccess},
    )(view)
    view = extend_schema(
        tags=['XP'],
        methods=['PATCH'],
        summary='Update XP rule (staff)',
        request=XPRuleSerializer,
        responses={200: XPGenericSuccess, 400: XPErrorEnvelope, 403: XPErrorEnvelope},
    )(view)
    return extend_schema(
        tags=['XP'],
        methods=['DELETE'],
        summary='Delete or deactivate XP rule (staff)',
        responses={200: XPGenericSuccess, 403: XPErrorEnvelope},
    )(view)

schema_admin_reverse = extend_schema(
    tags=['XP (Admin)'],
    summary='Reverse XP transaction (admin)',
    request=ReverseTransactionSerializer,
    responses={200: XPGenericSuccess, 400: XPErrorEnvelope, 403: XPErrorEnvelope},
)

schema_leaderboard = extend_schema(
    tags=['XP'],
    summary='XP leaderboard',
    parameters=[
        OpenApiParameter('period', str, description='daily | weekly | monthly | all_time (default)'),
        OpenApiParameter('category', str, description='Event category or overall'),
        OpenApiParameter('limit', int, description='Max entries (default 100, max 500)'),
        OpenApiParameter('user_id', str, description='Highlight rank for this user'),
    ],
    responses={200: XPLeaderboardEnvelope},
)
