from decimal import Decimal

from django.core.management.base import BaseCommand

from entertainment_platform.models import SubscriptionPlan


def _label(ent: str) -> str:
    return dict(SubscriptionPlan.ENTITLEMENT_CHOICES).get(ent, ent)


def _period_label(p: str) -> str:
    return dict(SubscriptionPlan.BILLING_PERIOD_CHOICES).get(p, p)


class Command(BaseCommand):
    help = 'Seed default AFN subscription plans (daily / weekly / season × three entitlements).'

    def handle(self, *args, **options):
        tiers = [
            ('daily', 24, Decimal('10.00')),
            ('weekly', 24 * 7, Decimal('59.00')),
            ('season', 24 * 90, Decimal('230.00')),
        ]
        entitlements = [
            'game_only',
            'game_and_streaming',
            'streaming_only',
        ]
        created = 0
        updated = 0
        for period, hours, price in tiers:
            for ent in entitlements:
                name = f'{_period_label(period)} — {_label(ent)}'
                desc = (
                    f'{_period_label(period)} access ({hours}h). '
                    f'Entitlement: {_label(ent)}. Billed in AFN.'
                )
                obj, was_created = SubscriptionPlan.objects.update_or_create(
                    billing_period=period,
                    entitlement_type=ent,
                    defaults={
                        'name': name[:100],
                        'description': desc,
                        'duration_hours': hours,
                        'price_afn': price,
                        'currency': 'AFN',
                        'status': 'active',
                        'features': {
                            'billing_period': period,
                            'entitlement_type': ent,
                        },
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
        self.stdout.write(self.style.SUCCESS(f'Subscription plans: {created} created, {updated} updated.'))
