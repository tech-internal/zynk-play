from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from entertainment_platform.models import User
from lucky_draw.exceptions import (
    LuckyDrawAlreadyEnteredError,
    LuckyDrawInsufficientXpError,
    LuckyDrawNoEntriesError,
)
from lucky_draw.models import LuckyDraw, LuckyDrawEntry, LuckyDrawWinner
from lucky_draw.services.draw import (
    cancel_lucky_draw,
    enter_lucky_draw,
    run_lucky_draw,
)
from xp_management.models import UserXPWallet
from xp_management.services.engine import get_or_create_wallet


class LuckyDrawTestMixin:
    def setUp(self):
        self.staff = User.objects.create(phone_number='+10000000010', role='staff')
        self.user1 = User.objects.create(phone_number='+10000000011')
        self.user2 = User.objects.create(phone_number='+10000000012')
        self.user3 = User.objects.create(phone_number='+10000000013')

        for user in (self.user1, self.user2, self.user3):
            wallet = get_or_create_wallet(user)
            wallet.available_xp = 1000
            wallet.save(update_fields=['available_xp'])

        self.draw = LuckyDraw.objects.create(
            title='Headphones Giveaway',
            category='electronics',
            prize_title='Sony WH-1000XM5',
            prize_description='Premium headphones',
            entry_xp=100,
            end_date=timezone.now() + timedelta(days=7),
            max_participants=3,
            winner_count=1,
            status='open',
            created_by=self.staff,
        )


class EnterLuckyDrawTests(LuckyDrawTestMixin, TestCase):
    def test_enter_success(self):
        result = enter_lucky_draw(
            draw_id=self.draw.id,
            user=self.user1,
            idempotency_key='enter-1',
        )
        self.assertEqual(result['xp_deducted'], 100)
        self.assertEqual(result['participant_count'], 1)
        self.assertEqual(result['draw_status'], 'open')
        self.assertTrue(LuckyDrawEntry.objects.filter(lucky_draw=self.draw, user=self.user1).exists())

        wallet = UserXPWallet.objects.get(user=self.user1)
        self.assertEqual(wallet.available_xp, 900)

    def test_insufficient_xp(self):
        wallet = UserXPWallet.objects.get(user=self.user1)
        wallet.available_xp = 50
        wallet.save(update_fields=['available_xp'])

        with self.assertRaises(LuckyDrawInsufficientXpError):
            enter_lucky_draw(
                draw_id=self.draw.id,
                user=self.user1,
                idempotency_key='enter-poor',
            )

    def test_duplicate_entry(self):
        enter_lucky_draw(
            draw_id=self.draw.id,
            user=self.user1,
            idempotency_key='enter-dup-1',
        )
        with self.assertRaises(LuckyDrawAlreadyEnteredError):
            enter_lucky_draw(
                draw_id=self.draw.id,
                user=self.user1,
                idempotency_key='enter-dup-2',
            )

    def test_auto_draw_at_max_participants(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='auto-1')
        enter_lucky_draw(draw_id=self.draw.id, user=self.user2, idempotency_key='auto-2')
        result = enter_lucky_draw(draw_id=self.draw.id, user=self.user3, idempotency_key='auto-3')

        self.assertTrue(result['auto_drawn'])
        self.assertEqual(result['draw_status'], 'drawn')
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'drawn')
        self.assertEqual(LuckyDrawWinner.objects.filter(lucky_draw=self.draw).count(), 1)


class RunLuckyDrawTests(LuckyDrawTestMixin, TestCase):
    def test_manual_draw(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='manual-1')
        enter_lucky_draw(draw_id=self.draw.id, user=self.user2, idempotency_key='manual-2')

        result = run_lucky_draw(draw_id=self.draw.id, triggered_by='staff')
        self.assertFalse(result['already_drawn'])
        self.assertEqual(len(result['winners']), 1)
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'drawn')

    def test_draw_with_no_entries(self):
        with self.assertRaises(LuckyDrawNoEntriesError):
            run_lucky_draw(draw_id=self.draw.id, triggered_by='staff')

    def test_draw_is_idempotent(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='idem-1')
        first = run_lucky_draw(draw_id=self.draw.id, triggered_by='staff')
        second = run_lucky_draw(draw_id=self.draw.id, triggered_by='staff')
        self.assertFalse(first['already_drawn'])
        self.assertTrue(second['already_drawn'])
        self.assertEqual(first['winners'], second['winners'])


class CancelLuckyDrawTests(LuckyDrawTestMixin, TestCase):
    def test_cancel_refunds_xp(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='cancel-1')
        enter_lucky_draw(draw_id=self.draw.id, user=self.user2, idempotency_key='cancel-2')

        wallet1_before = UserXPWallet.objects.get(user=self.user1).available_xp
        wallet2_before = UserXPWallet.objects.get(user=self.user2).available_xp

        result = cancel_lucky_draw(draw_id=self.draw.id, reason='Event postponed')
        self.assertEqual(result['refunded_entries'], 2)
        self.assertFalse(result['already_cancelled'])

        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'cancelled')
        self.assertEqual(UserXPWallet.objects.get(user=self.user1).available_xp, wallet1_before + 100)
        self.assertEqual(UserXPWallet.objects.get(user=self.user2).available_xp, wallet2_before + 100)


class LuckyDrawAPITests(LuckyDrawTestMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_staff_create_draw(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            '/api/v1/lucky-draws',
            {
                'title': 'New Draw',
                'category': 'merch',
                'prize_title': 'T-Shirt',
                'entry_xp': 200,
                'end_date': (timezone.now() + timedelta(days=3)).isoformat(),
                'max_participants': 50,
                'winner_count': 2,
                'status': 'open',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['title'], 'New Draw')

    def test_enter_via_api(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f'/api/v1/lucky-draws/{self.draw.id}/enter',
            {'idempotency_key': 'api-enter-1'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['xp_deducted'], 100)

    def test_announcements_after_draw(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='ann-1')
        run_lucky_draw(draw_id=self.draw.id, triggered_by='staff')

        response = self.client.get('/api/v1/lucky-draws/announcements')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['total'], 1)
        self.assertEqual(len(response.data['data']['items'][0]['winners']), 1)

    def test_staff_manual_draw_api(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='staff-draw-1')
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(f'/api/v1/lucky-draws/{self.draw.id}/draw')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['status'], 'drawn')

    def test_cancel_api_refunds(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='api-cancel-1')
        wallet_before = UserXPWallet.objects.get(user=self.user1).available_xp

        self.client.force_authenticate(user=self.staff)
        response = self.client.post(
            f'/api/v1/lucky-draws/{self.draw.id}/cancel',
            {'reason': 'Cancelled'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(UserXPWallet.objects.get(user=self.user1).available_xp, wallet_before + 100)


class ProcessLuckyDrawsTaskTests(LuckyDrawTestMixin, TestCase):
    def test_auto_process_expired_draw(self):
        enter_lucky_draw(draw_id=self.draw.id, user=self.user1, idempotency_key='task-1')
        self.draw.end_date = timezone.now() - timedelta(minutes=1)
        self.draw.save(update_fields=['end_date'])

        from lucky_draw.tasks import process_lucky_draws

        processed = process_lucky_draws()
        self.assertEqual(processed, 1)
        self.draw.refresh_from_db()
        self.assertEqual(self.draw.status, 'drawn')
