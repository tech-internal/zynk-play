# entertainment_platform/serializers.py
# DRF Serializers for API responses

import re

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from django.utils import timezone
from .models import (
    User, OTPRequest, SubscriptionPlan, UserSubscription,
    Transaction, StreamingContent, StreamSession, Game, GameSession
)
from .subscriptions import purchase_eligibility_reason


class UserSerializer(serializers.ModelSerializer):
    has_active_subscription = serializers.SerializerMethodField()
    has_game_entitlement = serializers.SerializerMethodField()
    has_streaming_entitlement = serializers.SerializerMethodField()
    can_use_free_trial = serializers.SerializerMethodField()
    profile_complete = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'username', 'full_name', 'email', 'country',
            'languages',
            'status', 'role', 'free_trial_used',
            'last_login_at', 'has_active_subscription', 'has_game_entitlement',
            'has_streaming_entitlement', 'can_use_free_trial', 'profile_complete',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'role', 'phone_number']

    @extend_schema_field(serializers.BooleanField())
    def get_has_active_subscription(self, obj):
        return obj.has_active_subscription()

    @extend_schema_field(serializers.BooleanField())
    def get_has_game_entitlement(self, obj):
        return obj.has_game_entitlement()

    @extend_schema_field(serializers.BooleanField())
    def get_has_streaming_entitlement(self, obj):
        return obj.has_streaming_entitlement()

    @extend_schema_field(serializers.BooleanField())
    def get_can_use_free_trial(self, obj):
        return obj.can_use_free_trial()

    @extend_schema_field(serializers.BooleanField())
    def get_profile_complete(self, obj):
        u = (obj.username or '').strip()
        n = (obj.full_name or '').strip()
        return bool(u and n)

    def validate_username(self, value):
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        v = value.strip()
        if len(v) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters.')
        if len(v) > 30:
            raise serializers.ValidationError('Username must be at most 30 characters.')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise serializers.ValidationError('Use letters, digits, and underscores only.')
        return v

    def validate_email(self, value):
        if value is None:
            return ''
        return value.strip()

    def validate_languages(self, value):
        if value is None:
            return ''
        return value.strip()[:200]

    def validate(self, attrs):
        username = attrs.get('username', serializers.empty)
        if username is serializers.empty:
            return attrs
        if username is None:
            attrs['username'] = None
            return attrs
        qs = User.objects.filter(username__iexact=username)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})
        return attrs


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6, required=False)

    def validate_phone_number(self, value):
        # Basic validation
        if not value.isdigit() and not value.startswith('+'):
            raise serializers.ValidationError("Invalid phone number format")
        return value


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """When serializer context includes ``request`` with an authenticated platform User, ``purchase_block_reason`` explains why checkout is blocked (null if allowed)."""

    purchase_block_reason = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'billing_period', 'entitlement_type',
            'duration_hours', 'price_afn', 'currency', 'status', 'features', 'created_at',
            'purchase_block_reason',
        ]
        read_only_fields = ['id', 'created_at', 'purchase_block_reason']

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_purchase_block_reason(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not isinstance(user, User):
            return None
        return purchase_eligibility_reason(user, obj)


class SubscriptionPlanManageSerializer(serializers.ModelSerializer):
    """Staff create/update of catalog plans."""

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'billing_period', 'entitlement_type',
            'duration_hours', 'price_afn', 'currency', 'status', 'features',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'billing_period', 'entitlement_type']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()
    remaining_hours = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = [
            'id', 'plan', 'status', 'start_at', 'end_at',
            'entitlement_type', 'billing_period', 'price_paid_afn',
            'plan_name_snapshot', 'purchase_phone_number', 'metadata',
            'is_active', 'remaining_hours', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(serializers.BooleanField())
    def get_is_active(self, obj):
        return obj.is_active()

    @extend_schema_field(serializers.FloatField())
    def get_remaining_hours(self, obj):
        if obj.is_active():
            delta = obj.end_at - timezone.now()
            return round(delta.total_seconds() / 3600, 2)
        return 0


class TransactionSerializer(serializers.ModelSerializer):
    plan = PlanBriefSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'plan', 'subscription', 'transaction_ref',
            'amount', 'currency', 'status', 'payment_method', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class StreamingContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StreamingContent
        fields = [
            'id', 'title', 'description', 'category', 'is_live',
            'thumbnail_url', 'duration_seconds', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StreamSessionSerializer(serializers.ModelSerializer):
    content = StreamingContentSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()
    time_remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = StreamSession
        fields = [
            'id', 'content', 'session_type', 'expires_at', 'signed_url',
            'status', 'is_active', 'time_remaining_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(serializers.BooleanField())
    def get_is_active(self, obj):
        return obj.is_active()

    @extend_schema_field(serializers.IntegerField())
    def get_time_remaining_seconds(self, obj):
        if obj.is_active():
            delta = obj.expires_at - timezone.now()
            return int(delta.total_seconds())
        return 0


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ['id', 'title', 'description', 'category', 'thumbnail_url', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class GameSessionSerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)

    class Meta:
        model = GameSession
        fields = ['id', 'game', 'session_token', 'started_at', 'ended_at', 'created_at']
        read_only_fields = ['id', 'created_at']


# ============================================================================
# REQUEST/RESPONSE SERIALIZERS
# ============================================================================

class SendOTPSerializer(serializers.Serializer):
    """Request format for OTP send"""
    phone_number = serializers.CharField(max_length=20)


class VerifyOTPSerializer(serializers.Serializer):
    """Request format for OTP verification"""
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6)


class RefreshTokenSerializer(serializers.Serializer):
    """Request format for token refresh"""
    refresh = serializers.CharField()


class PurchaseSubscriptionSerializer(serializers.Serializer):
    """Request format for subscription purchase"""
    plan_id = serializers.UUIDField()


class StartTrialSerializer(serializers.Serializer):
    """Request format for trial start"""
    content_id = serializers.UUIDField()


class AccessStreamSerializer(serializers.Serializer):
    """Request format for stream access"""
    content_id = serializers.UUIDField()


class LaunchGameSerializer(serializers.Serializer):
    """Request format for game launch"""
    game_id = serializers.UUIDField()


class PaymentWebhookSerializer(serializers.Serializer):
    """Request format for payment webhook"""
    transaction_ref = serializers.CharField()
    provider_ref = serializers.CharField()
    status = serializers.CharField()
    metadata = serializers.JSONField(required=False)


class TokenResponseSerializer(serializers.Serializer):
    """Response format for authentication tokens"""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class StreamAccessResponseSerializer(serializers.Serializer):
    """Response format for stream access"""
    signed_url = serializers.CharField()
    expires_in_seconds = serializers.IntegerField()
    session_id = serializers.UUIDField()
