from django.test import TestCase
from django.utils import timezone

from entertainment_platform.models import User
from xp_management.exceptions import XPDailyCapReachedError, XPEventNotFoundError
from xp_management.models import XPEvent, XPRule, UserXPWallet
from xp_management.services.engine import trigger_xp_event


class XPTriggerEventTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(phone_number='+10000000001')
        self.event = XPEvent.objects.create(
            event_code='WIN_MATCH_CASUAL',
            category='win',
            description='Test win',
        )
        XPRule.objects.create(
            event=self.event,
            rule_name='Test rule',
            base_xp=50,
            daily_cap_xp=200,
            cooldown_seconds=0,
            expiry_days=90,
        )

    def test_trigger_awards_xp(self):
        result = trigger_xp_event(
            event_code='WIN_MATCH_CASUAL',
            user_id=self.user.id,
            idempotency_key='test-key-1',
            occurred_at=timezone.now(),
        )
        self.assertEqual(result['xp_awarded'], 50)
        wallet = UserXPWallet.objects.get(user=self.user)
        self.assertEqual(wallet.available_xp, 50)
        self.assertEqual(wallet.total_xp_earned, 50)

    def test_idempotency_returns_same_result(self):
        trigger_xp_event(
            event_code='WIN_MATCH_CASUAL',
            user_id=self.user.id,
            idempotency_key='dup-key',
            occurred_at=timezone.now(),
        )
        from xp_management.exceptions import XPDuplicateRequestError

        with self.assertRaises(XPDuplicateRequestError):
            trigger_xp_event(
                event_code='WIN_MATCH_CASUAL',
                user_id=self.user.id,
                idempotency_key='dup-key',
                occurred_at=timezone.now(),
            )

    def test_unknown_event_raises(self):
        with self.assertRaises(XPEventNotFoundError):
            trigger_xp_event(
                event_code='UNKNOWN_EVENT',
                user_id=self.user.id,
                idempotency_key='x',
                occurred_at=timezone.now(),
            )

    def test_daily_cap(self):
        for i in range(4):
            trigger_xp_event(
                event_code='WIN_MATCH_CASUAL',
                user_id=self.user.id,
                idempotency_key=f'cap-{i}',
                occurred_at=timezone.now(),
            )
        with self.assertRaises(XPDailyCapReachedError):
            trigger_xp_event(
                event_code='WIN_MATCH_CASUAL',
                user_id=self.user.id,
                idempotency_key='cap-over',
                occurred_at=timezone.now(),
            )
