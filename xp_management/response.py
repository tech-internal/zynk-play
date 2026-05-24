import uuid
from datetime import datetime, timezone

from rest_framework.response import Response


def _meta(request):
    rid = getattr(request, 'request_id', None) or str(uuid.uuid4())
    return {
        'requestId': rid,
        'timestamp': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
    }


def xp_success(request, data, status=200):
    return Response(
        {'success': True, 'data': data, 'meta': _meta(request)},
        status=status,
    )


def xp_error(request, code, message, details=None, status=400):
    return Response(
        {
            'success': False,
            'error': {
                'code': code,
                'message': message,
                'details': details or {},
            },
            'meta': _meta(request),
        },
        status=status,
    )
