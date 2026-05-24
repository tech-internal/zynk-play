"""Session gate for password-protected XP integration docs."""

import secrets
from functools import wraps

from django.conf import settings
from django.shortcuts import redirect, render

SESSION_KEY = 'xp_docs_authenticated'


def xp_docs_enabled() -> bool:
    return getattr(settings, 'XP_DOCS_ENABLED', False) and bool(
        getattr(settings, 'XP_DOCS_PASSWORD', '')
    )


def verify_docs_credentials(username: str, password: str) -> bool:
    expected_user = getattr(settings, 'XP_DOCS_USERNAME', '')
    expected_pass = getattr(settings, 'XP_DOCS_PASSWORD', '')
    if not expected_pass:
        return False
    user_ok = secrets.compare_digest((username or '').strip(), expected_user)
    pass_ok = secrets.compare_digest(password or '', expected_pass)
    return user_ok and pass_ok


def xp_docs_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not xp_docs_enabled():
            return render(
                request,
                'xp_management/docs_disabled.html',
                status=503,
            )
        if not request.session.get(SESSION_KEY):
            return redirect('xp_management:docs_login')
        return view_func(request, *args, **kwargs)

    return wrapper
