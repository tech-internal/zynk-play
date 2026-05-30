"""
OpenAPI schema decorators for lucky draw views.
"""

from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import serializers

from .serializers import (
    LuckyDrawCancelSerializer,
    LuckyDrawCreateSerializer,
    LuckyDrawEnterSerializer,
    LuckyDrawUpdateSerializer,
)

XPMeta = inline_serializer(
    name='LuckyDrawMeta',
    fields={
        'requestId': serializers.CharField(),
        'timestamp': serializers.CharField(),
    },
)


def _success(name, data_fields):
    return inline_serializer(
        name=name,
        fields={
            'success': serializers.BooleanField(default=True),
            'data': inline_serializer(name=f'{name}Data', fields=data_fields),
            'meta': XPMeta,
        },
    )


LuckyDrawItem = inline_serializer(
    name='LuckyDrawItem',
    fields={
        'id': serializers.CharField(),
        'title': serializers.CharField(),
        'category': serializers.CharField(),
        'prize_title': serializers.CharField(),
        'entry_xp': serializers.IntegerField(),
        'end_date': serializers.CharField(),
        'max_participants': serializers.IntegerField(),
        'participant_count': serializers.IntegerField(),
        'status': serializers.CharField(),
        'user_entered': serializers.BooleanField(required=False),
    },
)

schema_draw_collection = extend_schema(
    tags=['Lucky Draw'],
    summary='List or create lucky draws',
    request=LuckyDrawCreateSerializer,
    responses={200: _success('LuckyDrawList', {'items': serializers.ListField(child=serializers.DictField())})},
    parameters=[
        OpenApiParameter(name='status', type=str, required=False),
        OpenApiParameter(name='category', type=str, required=False),
        OpenApiParameter(name='mine', type=bool, required=False),
    ],
)

schema_announcements = extend_schema(
    tags=['Lucky Draw'],
    summary='Recent lucky draw winner announcements',
    responses={200: _success('LuckyDrawAnnouncements', {'items': serializers.ListField(child=serializers.DictField())})},
)

schema_draw_detail = extend_schema(
    tags=['Lucky Draw'],
    summary='Get or update a lucky draw',
    request=LuckyDrawUpdateSerializer,
    responses={200: _success('LuckyDrawDetail', {'id': serializers.CharField()})},
)

schema_draw_enter = extend_schema(
    tags=['Lucky Draw'],
    summary='Enter a lucky draw',
    request=LuckyDrawEnterSerializer,
    responses={200: _success('LuckyDrawEnter', {'entry_id': serializers.CharField()})},
)

schema_draw_manual = extend_schema(
    tags=['Lucky Draw'],
    summary='Staff: run lucky draw manually',
    responses={200: _success('LuckyDrawRun', {'draw_id': serializers.CharField()})},
)

schema_draw_cancel = extend_schema(
    tags=['Lucky Draw'],
    summary='Staff: cancel lucky draw and refund XP',
    request=LuckyDrawCancelSerializer,
    responses={200: _success('LuckyDrawCancel', {'draw_id': serializers.CharField()})},
)

schema_draw_update = schema_draw_detail
