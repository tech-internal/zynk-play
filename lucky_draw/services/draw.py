"""
Lucky draw business logic — entry, draw, cancel.
"""
from __future__ import annotations

import secrets

from django.db import IntegrityError, transaction
from django.utils import timezone

from entertainment_platform.models import User
from xp_management.exceptions import XPInsufficientBalanceError
from xp_management.models import XPTransaction
from xp_management.services.engine import credit_xp_manual, debit_xp

from lucky_draw.exceptions import (
    LuckyDrawAlreadyDrawnError,
    LuckyDrawAlreadyEnteredError,
    LuckyDrawEndedError,
    LuckyDrawFullError,
    LuckyDrawInsufficientXpError,
    LuckyDrawInvalidStateError,
    LuckyDrawNoEntriesError,
    LuckyDrawNotFoundError,
    LuckyDrawNotOpenError,
)
from lucky_draw.models import LuckyDraw, LuckyDrawEntry, LuckyDrawWinner
from lucky_draw.utils import mask_display_name


def _get_draw_for_update(draw_id):
    try:
        return LuckyDraw.objects.select_for_update().get(pk=draw_id)
    except LuckyDraw.DoesNotExist as exc:
        raise LuckyDrawNotFoundError() from exc


def _winner_payload(winner: LuckyDrawWinner) -> dict:
    return {
        'rank': winner.rank,
        'user_id': str(winner.user_id),
        'display_name': mask_display_name(winner.user),
        'entry_id': str(winner.entry_id),
    }


def _draw_summary(draw: LuckyDraw, user: User | None = None) -> dict:
    data = {
        'id': str(draw.id),
        'title': draw.title,
        'description': draw.description,
        'category': draw.category,
        'prize_title': draw.prize_title,
        'prize_description': draw.prize_description,
        'prize_image_url': draw.prize_image_url,
        'entry_xp': draw.entry_xp,
        'end_date': draw.end_date.isoformat().replace('+00:00', 'Z'),
        'max_participants': draw.max_participants,
        'winner_count': draw.winner_count,
        'participant_count': draw.participant_count,
        'status': draw.status,
        'drawn_at': draw.drawn_at.isoformat().replace('+00:00', 'Z') if draw.drawn_at else None,
        'created_at': draw.created_at.isoformat().replace('+00:00', 'Z'),
        'is_accepting_entries': draw.is_accepting_entries,
    }
    if user is not None:
        if hasattr(draw, 'user_entered'):
            data['user_entered'] = draw.user_entered
        else:
            data['user_entered'] = draw.entries.filter(user=user).exists()
    if draw.status == 'drawn':
        data['winners'] = [
            _winner_payload(w)
            for w in draw.winners.select_related('user').order_by('rank')
        ]
    else:
        data['winners'] = []
    return data


@transaction.atomic
def enter_lucky_draw(*, draw_id, user: User, idempotency_key: str, request_id: str = '') -> dict:
    draw = _get_draw_for_update(draw_id)

    if draw.status != 'open':
        raise LuckyDrawNotOpenError()
    if timezone.now() >= draw.end_date:
        raise LuckyDrawEndedError()
    if draw.participant_count >= draw.max_participants:
        raise LuckyDrawFullError()
    if draw.entries.filter(user=user).exists():
        raise LuckyDrawAlreadyEnteredError()

    metadata = {
        'purpose': 'lucky_draw_entry',
        'lucky_draw_id': str(draw.id),
    }

    try:
        debit_result = debit_xp(
            user_id=user.id,
            amount=draw.entry_xp,
            idempotency_key=idempotency_key,
            source_metadata=metadata,
            request_id=request_id,
        )
    except XPInsufficientBalanceError as exc:
        raise LuckyDrawInsufficientXpError() from exc

    txn = XPTransaction.objects.get(pk=debit_result['transaction_id'])

    try:
        entry = LuckyDrawEntry.objects.create(
            lucky_draw=draw,
            user=user,
            xp_transaction=txn,
        )
    except IntegrityError as exc:
        raise LuckyDrawAlreadyEnteredError() from exc

    draw.participant_count += 1
    draw.save(update_fields=['participant_count', 'updated_at'])

    auto_drawn = False
    winners = []
    if draw.participant_count >= draw.max_participants:
        draw_result = run_lucky_draw(draw_id=draw.id, triggered_by='auto')
        auto_drawn = True
        winners = draw_result.get('winners', [])
        draw.refresh_from_db()

    return {
        'entry_id': str(entry.id),
        'xp_deducted': debit_result['xp_deducted'],
        'new_balance': debit_result['new_balance'],
        'participant_count': draw.participant_count,
        'draw_status': draw.status,
        'auto_drawn': auto_drawn,
        'winners': winners,
    }


@transaction.atomic
def run_lucky_draw(*, draw_id, triggered_by: str = 'auto') -> dict:
    draw = _get_draw_for_update(draw_id)

    if draw.status == 'drawn':
        winners = [
            _winner_payload(w)
            for w in draw.winners.select_related('user').order_by('rank')
        ]
        return {
            'draw_id': str(draw.id),
            'status': draw.status,
            'triggered_by': triggered_by,
            'winners': winners,
            'already_drawn': True,
        }

    if draw.status == 'cancelled':
        raise LuckyDrawInvalidStateError('Draw is cancelled')

    if draw.status not in ('open', 'closed'):
        raise LuckyDrawInvalidStateError(f'Cannot draw when status is {draw.status}')

    entries = list(draw.entries.select_related('user').all())
    if not entries:
        raise LuckyDrawNoEntriesError()

    winner_count = min(draw.winner_count, len(entries))
    picked = secrets.SystemRandom().sample(entries, winner_count)

    now = timezone.now()
    winner_rows = []
    for rank, entry in enumerate(picked, start=1):
        winner = LuckyDrawWinner.objects.create(
            lucky_draw=draw,
            user=entry.user,
            entry=entry,
            rank=rank,
        )
        winner_rows.append(_winner_payload(winner))

    draw.status = 'drawn'
    draw.drawn_at = now
    draw.save(update_fields=['status', 'drawn_at', 'updated_at'])

    return {
        'draw_id': str(draw.id),
        'status': draw.status,
        'triggered_by': triggered_by,
        'winners': winner_rows,
        'already_drawn': False,
    }


@transaction.atomic
def cancel_lucky_draw(*, draw_id, reason: str = '', request_id: str = '') -> dict:
    draw = _get_draw_for_update(draw_id)

    if draw.status == 'drawn':
        raise LuckyDrawAlreadyDrawnError()
    if draw.status == 'cancelled':
        return {
            'draw_id': str(draw.id),
            'status': draw.status,
            'refunded_entries': 0,
            'already_cancelled': True,
        }

    entries = list(draw.entries.select_related('user').all())
    refunded = 0
    for entry in entries:
        refund_key = f'lucky-draw-refund-{entry.id}'
        credit_xp_manual(
            user_id=entry.user_id,
            amount=draw.entry_xp,
            idempotency_key=refund_key,
            source_metadata={
                'purpose': 'lucky_draw_refund',
                'lucky_draw_id': str(draw.id),
                'entry_id': str(entry.id),
                'reason': reason,
            },
            request_id=request_id,
        )
        refunded += 1

    draw.status = 'cancelled'
    draw.save(update_fields=['status', 'updated_at'])

    return {
        'draw_id': str(draw.id),
        'status': draw.status,
        'refunded_entries': refunded,
        'reason': reason,
        'already_cancelled': False,
    }


def get_draw_detail(*, draw_id, user: User | None = None) -> dict:
    try:
        draw = LuckyDraw.objects.prefetch_related('winners__user').get(pk=draw_id)
    except LuckyDraw.DoesNotExist as exc:
        raise LuckyDrawNotFoundError() from exc
    return _draw_summary(draw, user=user)
