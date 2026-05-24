"""Password-protected XP integration portal for partners."""

import json

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect

from .constants import XP_TIERS
from .docs_auth import SESSION_KEY, verify_docs_credentials, xp_docs_enabled, xp_docs_login_required
from .models import XPEvent, XPRule


@require_http_methods(['GET', 'POST'])
@csrf_protect
def docs_login(request):
    if not xp_docs_enabled():
        return render(request, 'xp_management/docs_disabled.html', status=503)

    if request.session.get(SESSION_KEY):
        return redirect('xp_management:docs_portal')

    error = None
    if request.method == 'POST':
        username = request.POST.get('username', '')
        password = request.POST.get('password', '')
        if verify_docs_credentials(username, password):
            request.session[SESSION_KEY] = True
            request.session.set_expiry(60 * 60 * 8)  # 8 hours
            return redirect('xp_management:docs_portal')
        error = 'Invalid username or password.'

    return render(
        request,
        'xp_management/docs_login.html',
        {
            'error': error,
            'site_url': getattr(settings, 'SITE_URL', '').rstrip('/') or request.build_absolute_uri('/').rstrip('/'),
        },
    )


@xp_docs_login_required
def docs_portal(request):
    base = getattr(settings, 'SITE_URL', '').rstrip('/') or request.build_absolute_uri('/').rstrip('/')
    return render(
        request,
        'xp_management/docs_portal.html',
        {
            'api_base': base,
            'docs_username_hint': getattr(settings, 'XP_DOCS_USERNAME', 'xp-integration'),
        },
    )


@require_http_methods(['POST', 'GET'])
@xp_docs_login_required
def docs_logout(request):
    request.session.flush()
    return redirect('xp_management:docs_login')


@xp_docs_login_required
def docs_catalog(request):
    """JSON catalog of events and rules for the interactive portal."""
    events = []
    for ev in XPEvent.objects.filter(is_active=True).prefetch_related('rules'):
        rules = []
        for rule in ev.rules.filter(is_active=True):
            rules.append({
                'id': str(rule.id),
                'rule_name': rule.rule_name,
                'base_xp': rule.base_xp,
                'xp_formula_type': rule.xp_formula_type,
                'xp_formula_param': rule.xp_formula_param,
                'daily_cap_xp': rule.daily_cap_xp,
                'cooldown_seconds': rule.cooldown_seconds,
                'max_per_lifetime': rule.max_per_lifetime,
                'expiry_days': rule.expiry_days,
            })
        events.append({
            'event_code': ev.event_code,
            'category': ev.category,
            'description': ev.description,
            'requires_verification': ev.requires_verification,
            'rules': rules,
        })

    tiers = [
        {
            'id': t[0],
            'label': t[1],
            'min_xp': t[2],
            'max_xp': t[3],
            'multiplier': t[4],
            'expiry_days': t[5],
        }
        for t in XP_TIERS
    ]

    return JsonResponse({
        'events': events,
        'tiers': tiers,
        'endpoints': {
            'trigger_event': '/api/v1/xp/trigger-event',
            'balance': '/api/v1/xp/balance',
            'transactions': '/api/v1/xp/transactions',
            'redeem': '/api/v1/xp/redeem',
            'rules': '/api/v1/xp/rules',
            'leaderboard': '/api/v1/xp/leaderboard',
            'admin_reverse': '/api/v1/xp/admin/reverse',
            'mock_auth': '/api/v1/mock/auth/verify-otp',
        },
    })
