"""OpenAPI schema for mock Palzio PSP."""

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, inline_serializer
from rest_framework import serializers

PalzioCompleteRequest = inline_serializer(
    name='PalzioCompleteRequest',
    fields={
        'transaction_ref': serializers.CharField(),
        'checkout_token': serializers.CharField(),
        'outcome': serializers.ChoiceField(
            choices=['success', 'failed', 'insufficient_balance', 'user_dropped'],
        ),
        'payment_method': serializers.ChoiceField(
            choices=['card', 'upi', 'wallet'],
            default='card',
        ),
    },
)

PalzioCompleteResponse = inline_serializer(
    name='PalzioCompleteResponse',
    fields={
        'ok': serializers.BooleanField(),
        'outcome': serializers.CharField(),
        'platform_status': serializers.IntegerField(),
        'platform': serializers.JSONField(),
    },
)

schema_palzio_complete = extend_schema(
    tags=['PSP (Mock)'],
    summary='Complete Palzio checkout (mock)',
    description=(
        'Simulates payment completion and forwards a signed webhook to the platform. '
        'No JWT required; `checkout_token` must match `transaction_ref`.'
    ),
    request=PalzioCompleteRequest,
    responses={
        200: PalzioCompleteResponse,
        400: OpenApiResponse(description='Validation error'),
        401: OpenApiResponse(description='Invalid checkout token'),
        502: OpenApiResponse(description='Platform webhook failed'),
    },
    examples=[
        OpenApiExample(
            'Successful card payment',
            value={
                'transaction_ref': '550e8400-e29b-41d4-a716-446655440000',
                'checkout_token': 'v1.example.token',
                'outcome': 'success',
                'payment_method': 'card',
            },
        ),
    ],
    auth=[],
)
