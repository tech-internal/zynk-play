"""
Celery task: process XP expiry (TDD section 7).
Register in CELERY_BEAT_SCHEDULE when Celery is enabled.
"""
import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import XPTransaction, UserXPWallet
from .services.engine import get_or_create_wallet

logger = logging.getLogger(__name__)


@shared_task(name='xp_management.tasks.process_xp_expiry')
def process_xp_expiry():
    """Expire confirmed credits whose expires_at has passed."""
    now = timezone.now()
    due = XPTransaction.objects.filter(
        transaction_type='credit',
        status='confirmed',
        is_expired=False,
        expires_at__isnull=False,
        expires_at__lte=now,
    ).select_related('user')[:500]

    expired_count = 0
    for original in due:
        try:
            with transaction.atomic():
                wallet = UserXPWallet.objects.select_for_update().get(user=original.user)
                amount = original.xp_amount
                if amount <= 0:
                    original.is_expired = True
                    original.save(update_fields=['is_expired'])
                    continue

                deduct = min(amount, wallet.available_xp)
                balance_before = wallet.available_xp
                balance_after = balance_before - deduct

                XPTransaction.objects.create(
                    idempotency_key=f'expire-{original.id}',
                    user=original.user,
                    event=original.event,
                    rule=original.rule,
                    transaction_type='expire',
                    xp_amount=-deduct,
                    base_xp=amount,
                    balance_before=balance_before,
                    balance_after=balance_after,
                    status='confirmed',
                    source_metadata={'original_transaction_id': str(original.id)},
                    parent_transaction=original,
                    occurred_at=now,
                )

                wallet.available_xp = balance_after
                wallet.expired_xp += deduct
                wallet.save(update_fields=['available_xp', 'expired_xp', 'updated_at'])

                original.is_expired = True
                original.save(update_fields=['is_expired'])
                expired_count += 1
        except Exception:
            logger.exception('Failed to expire XP transaction %s', original.id)

    logger.info('XP expiry job processed %s credits', expired_count)
    return expired_count
