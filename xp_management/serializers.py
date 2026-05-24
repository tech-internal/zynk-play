from rest_framework import serializers

from .models import XPEvent, XPRedemptionItem, XPRule, XPTransaction
from .services.engine import normalize_source_metadata


class TriggerEventSerializer(serializers.Serializer):
    event_code = serializers.CharField(max_length=100)
    user_id = serializers.UUIDField()
    idempotency_key = serializers.CharField(max_length=200)
    occurred_at = serializers.DateTimeField()
    source_metadata = serializers.JSONField(required=False, default=dict)
    unit_count = serializers.IntegerField(required=False, default=1, min_value=1)

    def validate_source_metadata(self, value):
        return normalize_source_metadata(value)


class RedeemSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    redemption_item_id = serializers.UUIDField()
    xp_cost = serializers.IntegerField(min_value=1)
    idempotency_key = serializers.CharField(max_length=200)


class ReverseTransactionSerializer(serializers.Serializer):
    transaction_id = serializers.UUIDField()
    reason = serializers.ChoiceField(
        choices=['FRAUD', 'DUPLICATE', 'SYSTEM_ERROR', 'ADMIN_CORRECTION']
    )
    admin_note = serializers.CharField(required=False, allow_blank=True, default='')


class XPEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = XPEvent
        fields = [
            'id', 'event_code', 'category', 'description',
            'is_active', 'requires_verification', 'created_at',
        ]
        read_only_fields = fields


class XPRuleSerializer(serializers.ModelSerializer):
    event_code = serializers.CharField(source='event.event_code', read_only=True)
    category = serializers.CharField(source='event.category', read_only=True)

    class Meta:
        model = XPRule
        fields = [
            'id', 'event', 'event_code', 'category', 'rule_name', 'base_xp',
            'xp_formula_type', 'xp_formula_param', 'daily_cap_xp', 'global_daily_cap',
            'cooldown_seconds', 'max_per_lifetime', 'expiry_days', 'is_active',
            'valid_from', 'valid_until', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class XPRuleCreateSerializer(serializers.ModelSerializer):
    event_code = serializers.CharField(write_only=True)

    class Meta:
        model = XPRule
        fields = [
            'event_code', 'rule_name', 'base_xp', 'xp_formula_type', 'xp_formula_param',
            'daily_cap_xp', 'global_daily_cap', 'cooldown_seconds', 'max_per_lifetime',
            'expiry_days', 'is_active', 'valid_from', 'valid_until',
        ]

    def create(self, validated_data):
        from .models import XPEvent

        event_code = validated_data.pop('event_code')
        event = XPEvent.objects.get(event_code=event_code)
        validated_data['event'] = event
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class XPTransactionSerializer(serializers.ModelSerializer):
    event_code = serializers.CharField(source='event.event_code', read_only=True, allow_null=True)
    category = serializers.CharField(source='event.category', read_only=True, allow_null=True)

    class Meta:
        model = XPTransaction
        fields = [
            'id', 'idempotency_key', 'user_id', 'event_code', 'category',
            'transaction_type', 'xp_amount', 'base_xp', 'multiplier_applied',
            'balance_before', 'balance_after', 'status', 'source_metadata',
            'expires_at', 'is_expired', 'occurred_at', 'created_at',
        ]
