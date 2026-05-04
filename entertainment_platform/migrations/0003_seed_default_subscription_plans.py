# Generated data migration — default AFN catalog (daily / weekly / season × entitlements).

from decimal import Decimal

from django.db import migrations


def seed_default_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model('entertainment_platform', 'SubscriptionPlan')

    period_labels = {
        'daily': 'Daily pass',
        'weekly': 'Weekly',
        'season': 'Season (~3 months)',
    }
    ent_labels = {
        'game_only': 'Game only',
        'game_and_streaming': 'Game + streaming',
        'streaming_only': 'Streaming only',
    }

    tiers = [
        ('daily', 24, Decimal('10.00')),
        ('weekly', 24 * 7, Decimal('59.00')),
        ('season', 24 * 90, Decimal('230.00')),
    ]
    entitlements = ['game_only', 'game_and_streaming', 'streaming_only']

    for period, hours, price in tiers:
        for ent in entitlements:
            name = f'{period_labels[period]} — {ent_labels[ent]}'
            desc = (
                f'{period_labels[period]} access ({hours}h). '
                f'Entitlement: {ent_labels[ent]}. Billed in AFN.'
            )
            SubscriptionPlan.objects.update_or_create(
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


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('entertainment_platform', '0002_subscription_entitlements'),
    ]

    operations = [
        migrations.RunPython(seed_default_plans, noop_reverse),
    ]
