"""Subscription activation helpers (used by payments and demo checkout)."""

from datetime import timedelta

from django.db import transaction as db_transaction
from django.utils import timezone


def purchase_eligibility_reason(user, plan) -> str | None:
    """
    None if the user may start checkout for this plan.
    Enforces at most one active game lane and one streaming lane:
    - game_only: allowed only if user does not already have game access.
    - streaming_only: allowed only if user does not already have streaming access.
    - game_and_streaming: allowed only if user has neither (no duplicate bundle when one lane is already covered).
    """
    et = plan.entitlement_type
    hg = user.has_game_entitlement()
    hs = user.has_streaming_entitlement()

    if et == 'game_only':
        if hg:
            return 'You already have active game access. Cancel or wait for it to expire before buying another game pass.'
        return None
    if et == 'streaming_only':
        if hs:
            return 'You already have active streaming access. Cancel or wait for it to expire before buying another streaming pass.'
        return None
    if et == 'game_and_streaming':
        if hg and hs:
            return 'You already have game and streaming. Use single passes only if you need to renew one side.'
        if hg or hs:
            return 'You already have part of this bundle. Buy a game-only or streaming-only pass to add the missing service.'
        return None
    return 'Unknown plan type.'


def eligible_active_plan_ids(user):
    """UUID strings of catalog plans the user may purchase right now."""
    from .models import SubscriptionPlan

    out = []
    for plan in SubscriptionPlan.objects.filter(status='active').only('id', 'entitlement_type'):
        if purchase_eligibility_reason(user, plan) is None:
            out.append(str(plan.id))
    return out


def create_user_subscription_from_paid_transaction(txn):
    """
    Create an active UserSubscription from a successful Transaction.
    Expects txn.plan set and txn.amount reflecting paid AFN.
    """
    from .models import UserSubscription

    if txn.subscription_id:
        return txn.subscription

    plan = txn.plan
    if not plan:
        return None

    with db_transaction.atomic():
        sub = UserSubscription.objects.create(
            user=txn.user,
            plan=plan,
            status='active',
            start_at=timezone.now(),
            end_at=timezone.now() + timedelta(hours=plan.duration_hours),
            entitlement_type=plan.entitlement_type,
            billing_period=plan.billing_period,
            price_paid_afn=txn.amount,
            plan_name_snapshot=plan.name,
            purchase_phone_number=(txn.user.phone_number or '')[:20],
            metadata={'transaction_ref': str(txn.transaction_ref)},
        )
        txn.subscription = sub
        txn.save(update_fields=['subscription', 'updated_at'])
    return sub
