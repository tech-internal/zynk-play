# entertainment_platform/serializers.py
# DRF Serializers for API responses

from rest_framework import serializers
from django.utils import timezone
from .models import (
    User, OTPRequest, SubscriptionPlan, UserSubscription,
    Transaction, StreamingContent, StreamSession, Game, GameSession
)


class UserSerializer(serializers.ModelSerializer):
    has_active_subscription = serializers.SerializerMethodField()
    can_use_free_trial = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'status', 'free_trial_used',
            'last_login_at', 'has_active_subscription', 'can_use_free_trial',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_has_active_subscription(self, obj):
        return obj.has_active_subscription()

    def get_can_use_free_trial(self, obj):
        return obj.can_use_free_trial()


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
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'description', 'duration_hours', 'price_afn', 'currency', 'features', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()
    remaining_hours = serializers.SerializerMethodField()

    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'status', 'start_at', 'end_at', 'is_active', 'remaining_hours', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_is_active(self, obj):
        return obj.is_active()

    def get_remaining_hours(self, obj):
        if obj.is_active():
            delta = obj.end_at - timezone.now()
            return round(delta.total_seconds() / 3600, 2)
        return 0


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'transaction_ref', 'amount', 'currency', 'status', 'payment_method', 'created_at']
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

    def get_is_active(self, obj):
        return obj.is_active()

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
