"""
Mock Palzio PSP: accepts a checkout completion from the Palzio UI and POSTs
a signed callback to the entertainment platform payment webhook.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import uuid

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory

from entertainment_platform import views as ep_views
from entertainment_platform.palzio_tokens import palzio_signing_secret, verify_palzio_checkout_token

logger = logging.getLogger(__name__)

OUTCOMES = frozenset({'success', 'failed', 'insufficient_balance', 'user_dropped'})
METHODS = frozenset({'card', 'upi', 'wallet'})


def _sign_webhook_payload(body: dict) -> str | None:
    secret = palzio_signing_secret()
    if not secret:
        return None
    canonical = json.dumps(body, sort_keys=True, separators=(',', ':'))
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def _invoke_platform_webhook(body: dict, signature: str | None) -> Response:
    """Call the platform webhook in-process (avoids HTTP self-call deadlocks on some dev servers)."""
    factory = APIRequestFactory()
    meta = {}
    if signature:
        meta['HTTP_X_SIGNATURE'] = signature
    django_request = factory.post(
        '/api/v1/payments/webhook',
        body,
        format='json',
        **meta,
    )
    # Pass Django HttpRequest; @api_view wraps it into a DRF Request internally.
    return ep_views.payment_webhook(django_request)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def palzio_complete(request):
    """
    POST /psp/api/v1/complete/
    Body: {
      "transaction_ref": "...",
      "checkout_token": "v1....",
      "outcome": "success" | "failed" | "insufficient_balance" | "user_dropped",
      "payment_method": "card" | "upi" | "wallet"
    }
    """
    transaction_ref = request.data.get('transaction_ref')
    checkout_token = request.data.get('checkout_token')
    outcome = request.data.get('outcome')
    payment_method = request.data.get('payment_method', 'card')

    if not transaction_ref or not checkout_token:
        return Response(
            {'error': 'transaction_ref and checkout_token are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if outcome not in OUTCOMES:
        return Response(
            {'error': 'invalid outcome', 'allowed': sorted(OUTCOMES)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if payment_method not in METHODS:
        return Response(
            {'error': 'invalid payment_method', 'allowed': sorted(METHODS)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    claims = verify_palzio_checkout_token(checkout_token)
    if not claims or claims.get('transaction_ref') != transaction_ref:
        return Response({'error': 'invalid or expired checkout_token'}, status=status.HTTP_401_UNAUTHORIZED)

    provider_ref = f'palzio-mock-{uuid.uuid4()}'
    if outcome == 'success':
        webhook_status = 'success'
    elif outcome == 'user_dropped':
        webhook_status = 'user_dropped'
    else:
        webhook_status = outcome

    body = {
        'transaction_ref': transaction_ref,
        'provider_ref': provider_ref,
        'status': webhook_status,
        'payment_method': payment_method,
        'provider': 'palzio_mock',
        'raw_outcome': outcome,
    }
    sig = _sign_webhook_payload(body)

    try:
        platform_response = _invoke_platform_webhook(body, sig)
    except Exception as exc:
        logger.exception('Palzio PSP could not invoke platform webhook: %s', exc)
        return Response(
            {'error': 'platform_webhook_exception', 'detail': str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    platform_json = platform_response.data if hasattr(platform_response, 'data') else {}

    if platform_response.status_code >= 400:
        return Response(
            {
                'error': 'platform_webhook_error',
                'http_status': platform_response.status_code,
                'platform': platform_json,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(
        {
            'ok': True,
            'outcome': outcome,
            'platform_status': platform_response.status_code,
            'platform': platform_json,
        },
        status=status.HTTP_200_OK,
    )
