"""
Seed XP event registry and default rules from the XP Management System TDD v1.0.
"""
from django.core.management.base import BaseCommand

from xp_management.models import XPEvent, XPRule

# (event_code, category, description, base_xp, daily_cap, cooldown_sec, max_lifetime, expiry_days, formula_type, formula_param)
SEED_RULES = [
    # Watch
    ('WATCH_STREAM_5MIN', 'watch', 'Watch 5 continuous minutes', 25, 200, 300, None, 90, 'flat', {}),
    ('WATCH_STREAM_15MIN', 'watch', 'Watch 15 continuous minutes', 75, 300, 900, None, 90, 'flat', {}),
    ('WATCH_STREAM_30MIN', 'watch', 'Watch 30 continuous minutes', 150, 450, 1800, None, 90, 'flat', {}),
    ('WATCH_STREAM_60MIN', 'watch', 'Watch 60 continuous minutes', 300, 600, 3600, None, 90, 'flat', {}),
    ('WATCH_VOD_COMPLETE', 'watch', 'Complete a VOD from start to finish', 50, 500, 0, None, 90, 'flat', {}),
    ('WATCH_HIGHLIGHT_REEL', 'watch', 'Watch a curated highlight reel', 20, 200, 0, None, 90, 'flat', {}),
    ('WATCH_TOURNAMENT_LIVE', 'watch', 'Watch a live tournament stream', 100, 500, 0, None, 90, 'flat', {}),
    ('WATCH_FIRST_STREAM_DAY', 'watch', 'First stream watch of the day', 50, 50, 86400, None, 90, 'flat', {}),
    # Pay
    ('PAY_TOPUP', 'pay', 'In-app currency top-up', 1, None, 0, None, 180, 'per_unit', {'rate': 1, 'unit': 'per_10_inr'}),
    ('PAY_SUBSCRIPTION_MONTHLY', 'pay', 'Monthly subscription purchase', 500, None, 0, 1, 180, 'flat', {}),
    ('PAY_SUBSCRIPTION_ANNUAL', 'pay', 'Annual subscription purchase', 7500, None, 0, 1, 180, 'flat', {}),
    ('PAY_TOURNAMENT_ENTRY', 'pay', 'Tournament entry fee paid', 0, None, 0, None, 180, 'percentage', {'percent': 200}),
    ('PAY_GIFT_PURCHASE', 'pay', 'Virtual gift purchased', 0, None, 0, None, 180, 'percentage', {'percent': 150}),
    ('PAY_FIRST_PURCHASE', 'pay', 'First ever purchase on platform', 1000, None, 0, 1, 180, 'flat', {}),
    # Win
    ('WIN_MATCH_CASUAL', 'win', 'Win a casual match', 50, None, 0, None, 120, 'flat', {}),
    ('WIN_MATCH_RANKED', 'win', 'Win a ranked match', 100, None, 0, None, 120, 'flat', {}),
    ('WIN_TOURNAMENT_ROUND', 'win', 'Win a tournament round', 200, None, 0, None, 120, 'flat', {}),
    ('WIN_TOURNAMENT_CHAMPION', 'win', 'Win entire tournament', 2000, None, 0, None, 120, 'flat', {}),
    ('WIN_DAILY_CHALLENGE', 'win', 'Complete daily challenge', 150, None, 0, None, 120, 'flat', {}),
    ('WIN_WEEKLY_CHALLENGE', 'win', 'Complete weekly challenge', 500, None, 0, None, 120, 'flat', {}),
    ('WIN_ACHIEVEMENT_UNLOCK', 'win', 'Unlock an in-game achievement', 50, None, 0, None, 120, 'flat', {}),
    ('WIN_FIRST_MATCH', 'win', 'First match ever played', 200, None, 0, 1, 120, 'flat', {}),
    ('WIN_STREAK_BONUS', 'win', 'Win 3 matches in a row', 300, 300, 86400, 1, 120, 'flat', {}),
    # Share
    ('SHARE_CLIP_TWITTER', 'share', 'Share game clip to Twitter/X', 75, 225, 0, None, 90, 'flat', {}),
    ('SHARE_CLIP_INSTAGRAM', 'share', 'Share clip to Instagram', 75, 225, 0, None, 90, 'flat', {}),
    ('SHARE_CLIP_FACEBOOK', 'share', 'Share clip to Facebook', 50, 100, 0, None, 90, 'flat', {}),
    ('SHARE_CLIP_YOUTUBE', 'share', 'Upload clip to YouTube', 150, 150, 0, None, 90, 'flat', {}),
    ('SHARE_CLIP_TIKTOK', 'share', 'Post game clip to TikTok', 100, 200, 0, None, 90, 'flat', {}),
    ('SHARE_PROFILE_INVITE', 'share', 'Share referral link to social', 200, None, 0, None, 90, 'flat', {}),
    ('SHARE_TOURNAMENT_RESULT', 'share', 'Share tournament win/placement', 250, None, 0, None, 90, 'flat', {}),
    # Platform
    ('LOGIN_DAILY', 'platform', 'Daily login to the platform', 100, 100, 86400, None, 120, 'flat', {}),
    ('LOGIN_STREAK_7D', 'platform', 'Login 7 consecutive days', 500, None, 0, None, 120, 'flat', {}),
    ('LOGIN_STREAK_30D', 'platform', 'Login 30 consecutive days', 3000, None, 0, None, 120, 'flat', {}),
    ('PROFILE_COMPLETE', 'platform', 'Complete user profile (one-time)', 250, None, 0, 1, 120, 'flat', {}),
    ('REFERRAL_SIGNUP', 'platform', 'Referred user completes registration', 500, None, 0, None, 120, 'flat', {}),
    ('REFERRAL_FIRST_GAME', 'platform', 'Referred user plays first game', 300, None, 0, None, 120, 'flat', {}),
]

REQUIRES_VERIFICATION = {
    'SHARE_CLIP_TWITTER', 'SHARE_CLIP_INSTAGRAM', 'SHARE_CLIP_FACEBOOK',
    'SHARE_CLIP_YOUTUBE', 'SHARE_CLIP_TIKTOK', 'SHARE_TOURNAMENT_RESULT',
}


class Command(BaseCommand):
    help = 'Seed XP events and default rules from TDD v1.0'

    def handle(self, *args, **options):
        created_events = 0
        created_rules = 0

        for row in SEED_RULES:
            code, category, desc, base_xp, daily_cap, cooldown, max_life, expiry, formula, params = row
            event, ev_created = XPEvent.objects.get_or_create(
                event_code=code,
                defaults={
                    'category': category,
                    'description': desc,
                    'requires_verification': code in REQUIRES_VERIFICATION,
                },
            )
            if ev_created:
                created_events += 1

            rule_name = f'{code} — Base Rule'
            _, rule_created = XPRule.objects.get_or_create(
                event=event,
                rule_name=rule_name,
                defaults={
                    'base_xp': base_xp,
                    'xp_formula_type': formula,
                    'xp_formula_param': params,
                    'daily_cap_xp': daily_cap,
                    'cooldown_seconds': cooldown or 0,
                    'max_per_lifetime': max_life,
                    'expiry_days': expiry,
                },
            )
            if rule_created:
                created_rules += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seed complete: {created_events} new events, {created_rules} new rules '
                f'({len(SEED_RULES)} total definitions).'
            )
        )
