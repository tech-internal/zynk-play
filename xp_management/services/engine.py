"""
XP Rule Engine — all balance changes flow through trigger_xp_event.
"""
from __future__ import annotations

import json
import logging
import secrets
from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from entertainment_platform.models import User

from xp_management.constants import next_tier_info, tier_for_total_xp, tier_multiplier
from xp_management.exceptions import (
    XPCooldownActiveError,
    XPDailyCapReachedError,
    XPDuplicateRequestError,
    XPEventNotFoundError,
    XPInsufficientBalanceError,
    XPInvalidRedemptionError,
    XPLifetimeCapReachedError,
    XPRuleNotFoundError,
)
from xp_management.models import (
    XPAuditLog,
    XPEvent,
    XPRedemptionItem,
    XPRule,
    XPTransaction,
    UserXPWallet,
)

logger = logging.getLogger(__name__)


def normalize_source_metadata(value) -> dict:
    """
    Swagger and some clients send source_metadata as a JSON string or omit it.
    The engine always expects a dict.
    """
    if value is None or value == '':
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


def get_or_create_wallet(user: User) -> UserXPWallet:
    wallet, _ = UserXPWallet.objects.get_or_create(user=user)
    return wallet


def _compute_base_xp(rule: XPRule, unit_count: int, source_metadata: dict) -> int:
    formula = rule.xp_formula_type
    params = rule.xp_formula_param or {}

    if formula == 'flat':
        return rule.base_xp

    if formula == 'per_unit':
        rate = params.get('rate', rule.base_xp)
        return max(0, int(rate * max(unit_count, 1)))

    if formula == 'percentage':
        amount = source_metadata.get('amount') or source_metadata.get('transaction_amount') or 0
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            amount = 0
        pct = params.get('percent', rule.base_xp) / 100.0
        return max(0, int(amount * pct))

    if formula == 'tiered':
        amount = source_metadata.get('amount') or 0
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            amount = 0
        tiers = params.get('tiers', [])
        mult = 1.0
        for tier in tiers:
            low = tier.get('min', 0)
            high = tier.get('max')
            if amount >= low and (high is None or amount <= high):
                mult = float(tier.get('multiplier', 1))
                break
        return max(0, int(rule.base_xp * mult))

    return rule.base_xp


def _resolve_active_rule(event: XPEvent, at) -> XPRule:
    rules = (
        XPRule.objects.filter(event=event, is_active=True)
        .order_by('-created_at')
    )
    for rule in rules:
        if rule.is_valid_now(at):
            return rule
    raise XPRuleNotFoundError(f'No active rule for event: {event.event_code}')


def _today_start():
    now = timezone.now()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _sum_today_credits(user: User, rule: XPRule) -> int:
    start = _today_start()
    total = (
        XPTransaction.objects.filter(
            user=user,
            rule=rule,
            transaction_type__in=('credit', 'bonus'),
            status='confirmed',
            created_at__gte=start,
        ).aggregate(s=Sum('xp_amount'))['s']
    )
    return int(total or 0)


def _check_caps_and_cooldown(user: User, rule: XPRule, at) -> None:
    if rule.max_per_lifetime is not None:
        count = XPTransaction.objects.filter(
            user=user,
            rule=rule,
            transaction_type__in=('credit', 'bonus'),
            status='confirmed',
        ).count()
        if count >= rule.max_per_lifetime:
            raise XPLifetimeCapReachedError()

    if rule.daily_cap_xp is not None:
        earned = _sum_today_credits(user, rule)
        if earned >= rule.daily_cap_xp:
            raise XPDailyCapReachedError(details={'daily_cap_xp': rule.daily_cap_xp, 'earned_today': earned})

    if rule.cooldown_seconds > 0:
        last = (
            XPTransaction.objects.filter(
                user=user,
                rule=rule,
                transaction_type__in=('credit', 'bonus'),
                status='confirmed',
            )
            .order_by('-created_at')
            .first()
        )
        if last:
            elapsed = (at - last.created_at).total_seconds()
            if elapsed < rule.cooldown_seconds:
                remaining = int(rule.cooldown_seconds - elapsed)
                raise XPCooldownActiveError(details={'seconds_remaining': remaining})


def _apply_tier(wallet: UserXPWallet) -> bool:
    new_tier = tier_for_total_xp(wallet.total_xp_earned)
    if new_tier != wallet.xp_tier:
        wallet.xp_tier = new_tier
        wallet.tier_updated_at = timezone.now()
        return True
    return False


def _audit(actor_user, action_type, target_entity, target_id, before, after, request_id='', source_ip=None):
    XPAuditLog.objects.create(
        actor_user=actor_user,
        actor_label=str(actor_user.id) if actor_user else 'system',
        action_type=action_type,
        target_entity=target_entity,
        target_id=target_id,
        before_state=before,
        after_state=after,
        request_id=request_id,
        source_ip=source_ip,
    )


def _transaction_payload(txn: XPTransaction, wallet: UserXPWallet) -> dict:
    return {
        'transaction_id': str(txn.id),
        'xp_awarded': txn.xp_amount,
        'base_xp': txn.base_xp,
        'multiplier': float(txn.multiplier_applied),
        'new_balance': wallet.available_xp,
        'expires_at': txn.expires_at.isoformat().replace('+00:00', 'Z') if txn.expires_at else None,
        'tier_updated': False,
        'current_tier': wallet.xp_tier.upper(),
    }


@transaction.atomic
def trigger_xp_event(
    *,
    event_code: str,
    user_id,
    idempotency_key: str,
    occurred_at=None,
    source_metadata=None,
    unit_count: int = 1,
    request_id: str = '',
    source_ip=None,
) -> dict:
    source_metadata = normalize_source_metadata(source_metadata)
    at = occurred_at or timezone.now()

    existing = XPTransaction.objects.filter(idempotency_key=idempotency_key).select_related('user').first()
    if existing and existing.status == 'confirmed':
        wallet = get_or_create_wallet(existing.user)
        raise XPDuplicateRequestError(details=_transaction_payload(existing, wallet))

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist as exc:
        raise XPEventNotFoundError('User not found') from exc

    try:
        event = XPEvent.objects.get(event_code=event_code, is_active=True)
    except XPEvent.DoesNotExist as exc:
        raise XPEventNotFoundError(f'event_code does not exist: {event_code}') from exc

    rule = _resolve_active_rule(event, at)
    _check_caps_and_cooldown(user, rule, at)

    base_xp = _compute_base_xp(rule, unit_count, source_metadata)
    wallet = UserXPWallet.objects.select_for_update().get_or_create(user=user)[0]

    tier_mult = tier_multiplier(wallet.xp_tier)
    campaign_mult = float(source_metadata.get('campaign_multiplier', 1) or 1)
    final_mult = Decimal(str(round(tier_mult * campaign_mult, 2)))
    xp_awarded = max(0, int(base_xp * float(final_mult)))

    if rule.daily_cap_xp is not None:
        earned = _sum_today_credits(user, rule)
        remaining = rule.daily_cap_xp - earned
        if remaining <= 0:
            raise XPDailyCapReachedError()
        xp_awarded = min(xp_awarded, remaining)

    balance_before = wallet.available_xp
    balance_after = balance_before + xp_awarded

    expires_at = None
    if rule.expiry_days and xp_awarded > 0:
        expires_at = at + timedelta(days=rule.expiry_days)

    txn = XPTransaction.objects.create(
        idempotency_key=idempotency_key,
        user=user,
        event=event,
        rule=rule,
        transaction_type='credit',
        xp_amount=xp_awarded,
        base_xp=base_xp,
        multiplier_applied=final_mult,
        balance_before=balance_before,
        balance_after=balance_after,
        status='confirmed',
        source_metadata=source_metadata,
        expires_at=expires_at,
        occurred_at=at,
    )

    wallet.available_xp = balance_after
    wallet.total_xp_earned += xp_awarded
    tier_updated = _apply_tier(wallet)
    wallet.version += 1
    wallet.save(update_fields=['available_xp', 'total_xp_earned', 'xp_tier', 'tier_updated_at', 'version', 'updated_at'])

    _audit(
        user,
        'XP_CREDIT',
        'xp_transaction',
        txn.id,
        {'balance': balance_before},
        {'balance': balance_after, 'xp_awarded': xp_awarded},
        request_id=request_id,
        source_ip=source_ip,
    )

    payload = _transaction_payload(txn, wallet)
    payload['tier_updated'] = tier_updated
    return payload


@transaction.atomic
def redeem_xp(
    *,
    user_id,
    redemption_item_id,
    xp_cost: int,
    idempotency_key: str,
    request_id: str = '',
) -> dict:
    existing = XPTransaction.objects.filter(idempotency_key=idempotency_key).first()
    if existing and existing.status == 'confirmed':
        wallet = get_or_create_wallet(existing.user)
        return {
            'transaction_id': str(existing.id),
            'xp_deducted': abs(existing.xp_amount),
            'new_balance': wallet.available_xp,
            'redemption_code': existing.source_metadata.get('redemption_code', ''),
        }

    user = User.objects.get(pk=user_id)
    try:
        item = XPRedemptionItem.objects.get(pk=redemption_item_id, is_active=True)
    except XPRedemptionItem.DoesNotExist as exc:
        raise XPInvalidRedemptionError('Redemption item not found') from exc

    if item.xp_cost != xp_cost:
        raise XPInvalidRedemptionError('xp_cost does not match catalog item')

    wallet = UserXPWallet.objects.select_for_update().get(user=user)
    if wallet.available_xp < xp_cost:
        raise XPInsufficientBalanceError()

    balance_before = wallet.available_xp
    balance_after = balance_before - xp_cost
    code = f'REWARD-{secrets.token_hex(4).upper()}'

    txn = XPTransaction.objects.create(
        idempotency_key=idempotency_key,
        user=user,
        transaction_type='debit',
        xp_amount=-xp_cost,
        base_xp=xp_cost,
        balance_before=balance_before,
        balance_after=balance_after,
        status='confirmed',
        source_metadata={'redemption_item_id': str(item.id), 'redemption_code': code},
    )

    wallet.available_xp = balance_after
    wallet.redeemed_xp += xp_cost
    wallet.version += 1
    wallet.save(update_fields=['available_xp', 'redeemed_xp', 'version', 'updated_at'])

    return {
        'transaction_id': str(txn.id),
        'xp_deducted': xp_cost,
        'new_balance': balance_after,
        'redemption_code': code,
    }


@transaction.atomic
def reverse_transaction(
    *,
    transaction_id,
    reason: str,
    admin_user: User | None,
    admin_note: str = '',
    request_id: str = '',
) -> dict:
    original = XPTransaction.objects.select_for_update().get(pk=transaction_id)
    if original.status != 'confirmed' or original.transaction_type not in ('credit', 'bonus'):
        raise XPInvalidRedemptionError('Only confirmed credit transactions can be reversed')

    if original.child_transactions.filter(transaction_type='reversal', status='confirmed').exists():
        raise XPDuplicateRequestError('Transaction already reversed')

    user = original.user
    wallet = UserXPWallet.objects.select_for_update().get(user=user)
    amount = abs(original.xp_amount)
    balance_before = wallet.available_xp
    balance_after = max(0, balance_before - amount)

    rev_key = f'reverse-{original.id}'
    rev = XPTransaction.objects.create(
        idempotency_key=rev_key,
        user=user,
        event=original.event,
        rule=original.rule,
        transaction_type='reversal',
        xp_amount=-amount,
        base_xp=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status='confirmed',
        source_metadata={'reason': reason, 'admin_note': admin_note, 'original_id': str(original.id)},
        parent_transaction=original,
    )
    original.status = 'reversed'
    original.save(update_fields=['status'])

    wallet.available_xp = balance_after
    wallet.version += 1
    wallet.save(update_fields=['available_xp', 'version', 'updated_at'])

    _audit(
        admin_user,
        'XP_REVERSAL',
        'xp_transaction',
        rev.id,
        {'original': str(original.id), 'balance': balance_before},
        {'balance': balance_after, 'reason': reason},
        request_id=request_id,
    )

    return {
        'reversal_transaction_id': str(rev.id),
        'xp_reversed': amount,
        'new_balance': balance_after,
    }
