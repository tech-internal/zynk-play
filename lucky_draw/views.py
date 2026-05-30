import uuid

from django.db.models import Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated

from entertainment_platform.permissions import IsPlatformStaff
from xp_management.response import xp_error, xp_success

from .exceptions import LuckyDrawError
from .models import LuckyDraw, LuckyDrawEntry
from .openapi import (
    schema_announcements,
    schema_draw_cancel,
    schema_draw_collection,
    schema_draw_detail,
    schema_draw_enter,
    schema_draw_manual,
    schema_draw_update,
)
from .serializers import (
    LuckyDrawCancelSerializer,
    LuckyDrawCreateSerializer,
    LuckyDrawEnterSerializer,
    LuckyDrawUpdateSerializer,
)
from .services.draw import (
    cancel_lucky_draw,
    enter_lucky_draw,
    get_draw_detail,
    run_lucky_draw,
    _draw_summary,
)
from .utils import mask_display_name


class LuckyDrawPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'per_page'
    max_page_size = 100


def _request_id(request):
    rid = request.headers.get('X-Request-Id') or str(uuid.uuid4())
    request.request_id = rid
    return rid


def _handle_draw_errors(request, fn):
    try:
        return fn()
    except LuckyDrawError as exc:
        return xp_error(
            request,
            exc.code,
            exc.message,
            details=exc.details,
            status=exc.http_status,
        )


@schema_draw_collection
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lucky_draw_collection(request):
    """
    GET /api/v1/lucky-draws — list draws
    POST /api/v1/lucky-draws — create draw (staff)
    """
    if request.method == 'GET':
        qs = LuckyDraw.objects.all()
        status_filter = request.query_params.get('status')
        category = request.query_params.get('category')
        mine = request.query_params.get('mine', '').lower() in ('true', '1', 'yes')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category=category)
        if mine:
            qs = qs.filter(entries__user=request.user).distinct()

        qs = qs.annotate(
            user_entered=Exists(
                LuckyDrawEntry.objects.filter(
                    lucky_draw_id=OuterRef('pk'),
                    user_id=request.user.pk,
                )
            )
        )

        paginator = LuckyDrawPagination()
        page = paginator.paginate_queryset(qs.order_by('-created_at'), request)
        items = [_draw_summary(draw, user=request.user) for draw in page]
        return xp_success(request, {
            'items': items,
            'page': paginator.page.number,
            'per_page': paginator.get_page_size(request),
            'total': paginator.page.paginator.count,
        })

    if getattr(request.user, 'role', '') != 'staff':
        return xp_error(request, 'LUCKY_DRAW_FORBIDDEN', 'Staff access required', status=403)

    ser = LuckyDrawCreateSerializer(data=request.data)
    if not ser.is_valid():
        return xp_error(
            request,
            'LUCKY_DRAW_VALIDATION_ERROR',
            'Invalid request body',
            details=ser.errors,
            status=400,
        )

    draw = ser.save(created_by=request.user)
    return xp_success(request, _draw_summary(draw, user=request.user), status=201)


@schema_announcements
@api_view(['GET'])
@permission_classes([AllowAny])
def lucky_draw_announcements(request):
    """GET /api/v1/lucky-draws/announcements — recent winners feed."""
    qs = (
        LuckyDraw.objects.filter(status='drawn')
        .prefetch_related('winners__user')
        .order_by('-drawn_at')
    )

    paginator = LuckyDrawPagination()
    page = paginator.paginate_queryset(qs, request)
    items = []
    for draw in page:
        items.append({
            'draw_id': str(draw.id),
            'title': draw.title,
            'prize_title': draw.prize_title,
            'category': draw.category,
            'drawn_at': draw.drawn_at.isoformat().replace('+00:00', 'Z') if draw.drawn_at else None,
            'winners': [
                {
                    'rank': w.rank,
                    'display_name': mask_display_name(w.user),
                    'user_id': str(w.user_id),
                }
                for w in sorted(draw.winners.all(), key=lambda w: w.rank)
            ],
        })

    return xp_success(request, {
        'items': items,
        'page': paginator.page.number,
        'per_page': paginator.get_page_size(request),
        'total': paginator.page.paginator.count,
    })


@schema_draw_detail
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def lucky_draw_detail(request, draw_id):
    """
    GET /api/v1/lucky-draws/<uuid> — draw detail
    PATCH /api/v1/lucky-draws/<uuid> — update draw (staff)
    """
    draw = get_object_or_404(LuckyDraw, pk=draw_id)

    if request.method == 'GET':
        return xp_success(request, get_draw_detail(draw_id=draw_id, user=request.user))

    if getattr(request.user, 'role', '') != 'staff':
        return xp_error(request, 'LUCKY_DRAW_FORBIDDEN', 'Staff access required', status=403)

    if draw.status in ('drawn', 'cancelled'):
        return xp_error(
            request,
            'LUCKY_DRAW_INVALID_STATE',
            'Cannot update a drawn or cancelled lucky draw',
            status=400,
        )

    ser = LuckyDrawUpdateSerializer(draw, data=request.data, partial=True)
    if not ser.is_valid():
        return xp_error(
            request,
            'LUCKY_DRAW_VALIDATION_ERROR',
            'Invalid request body',
            details=ser.errors,
            status=400,
        )

    updated = ser.save()
    return xp_success(request, _draw_summary(updated, user=request.user))


@schema_draw_enter
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lucky_draw_enter(request, draw_id):
    """POST /api/v1/lucky-draws/<uuid>/enter — enter a draw."""
    ser = LuckyDrawEnterSerializer(data=request.data)
    if not ser.is_valid():
        return xp_error(
            request,
            'LUCKY_DRAW_VALIDATION_ERROR',
            'Invalid request body',
            details=ser.errors,
            status=400,
        )

    rid = _request_id(request)

    def run():
        result = enter_lucky_draw(
            draw_id=draw_id,
            user=request.user,
            idempotency_key=ser.validated_data['idempotency_key'],
            request_id=rid,
        )
        return xp_success(request, result)

    return _handle_draw_errors(request, run)


@schema_draw_manual
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPlatformStaff])
def lucky_draw_run(request, draw_id):
    """POST /api/v1/lucky-draws/<uuid>/draw — staff manual draw."""
    rid = _request_id(request)

    def run():
        result = run_lucky_draw(draw_id=draw_id, triggered_by='staff')
        return xp_success(request, result)

    return _handle_draw_errors(request, run)


@schema_draw_cancel
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPlatformStaff])
def lucky_draw_cancel(request, draw_id):
    """POST /api/v1/lucky-draws/<uuid>/cancel — cancel and refund entries."""
    ser = LuckyDrawCancelSerializer(data=request.data)
    if not ser.is_valid():
        return xp_error(
            request,
            'LUCKY_DRAW_VALIDATION_ERROR',
            'Invalid request body',
            details=ser.errors,
            status=400,
        )

    rid = _request_id(request)

    def run():
        result = cancel_lucky_draw(
            draw_id=draw_id,
            reason=ser.validated_data.get('reason', ''),
            request_id=rid,
        )
        return xp_success(request, result)

    return _handle_draw_errors(request, run)
