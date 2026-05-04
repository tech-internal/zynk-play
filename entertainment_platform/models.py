# entertainment_platform/models.py
# Core Django models for the Entertainment Platform

import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from datetime import timedelta
import hashlib


class User(models.Model):
    """Core user model for OTP-based authentication"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('deleted', 'Deleted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')]
    )
    username = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text='Public handle; set once from profile. Must be unique when present.',
    )
    full_name = models.CharField(max_length=120, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    country = models.CharField(max_length=80, blank=True, default='', help_text='Optional country or region')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    role = models.CharField(
        max_length=20,
        default='user',
        help_text='user | staff — staff may manage subscription plans via API',
    )
    free_trial_used = models.BooleanField(default=False)
    free_trial_used_at = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.phone_number

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return self.status == 'active'

    def active_subscriptions(self):
        return self.user_subscriptions.filter(status='active', end_at__gt=timezone.now())

    def has_game_entitlement(self):
        for sub in self.active_subscriptions():
            if sub.entitlement_type in ('game_only', 'game_and_streaming'):
                return True
        return False

    def has_streaming_entitlement(self):
        for sub in self.active_subscriptions():
            if sub.entitlement_type in ('streaming_only', 'game_and_streaming'):
                return True
        return False

    def has_active_subscription(self):
        """Any non-expired active subscription (legacy + UI)."""
        return self.active_subscriptions().exists()

    def can_use_free_trial(self):
        """Check if user is eligible for free trial"""
        return not self.free_trial_used and self.status == 'active'


class OTPRequest(models.Model):
    """OTP request tracking and verification"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20)
    otp_code_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'otp_requests'
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['status']),
            models.Index(fields=['expires_at']),
        ]

    @staticmethod
    def hash_otp(otp_code):
        """Hash OTP for secure storage"""
        return hashlib.sha256(otp_code.encode()).hexdigest()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def verify_otp(self, otp_code):
        """Verify OTP code"""
        if self.is_expired():
            self.status = 'expired'
            self.save()
            return False
        
        if self.attempts >= 5:
            return False
        
        if self.otp_code_hash == self.hash_otp(otp_code):
            self.status = 'verified'
            self.save()
            return True
        
        self.attempts += 1
        self.save()
        return False


class SubscriptionPlan(models.Model):
    """Available subscription plans (duration × entitlement)."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    BILLING_PERIOD_CHOICES = [
        ('daily', 'Daily pass'),
        ('weekly', 'Weekly'),
        ('season', 'Season (~3 months)'),
    ]
    ENTITLEMENT_CHOICES = [
        ('game_only', 'Game only'),
        ('game_and_streaming', 'Game + streaming'),
        ('streaming_only', 'Streaming only'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    billing_period = models.CharField(
        max_length=20,
        choices=BILLING_PERIOD_CHOICES,
        default='daily',
    )
    entitlement_type = models.CharField(
        max_length=32,
        choices=ENTITLEMENT_CHOICES,
        default='game_and_streaming',
    )
    duration_hours = models.IntegerField(
        help_text='Wall-clock access length (e.g. 24 for daily, 2160 for ~90 days)',
    )
    price_afn = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='AFN')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    features = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_plans'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['billing_period', 'entitlement_type']),
        ]

    def __str__(self):
        return self.name


class UserSubscription(models.Model):
    """User subscription entitlements"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    entitlement_type = models.CharField(max_length=32, default='game_and_streaming')
    billing_period = models.CharField(max_length=20, default='daily')
    price_paid_afn = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    plan_name_snapshot = models.CharField(max_length=160, blank=True, default='')
    purchase_phone_number = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text='Mobile number recorded at purchase (same as account phone unless overridden later)',
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_subscriptions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['end_at']),
            models.Index(fields=['entitlement_type']),
        ]

    def is_active(self):
        return self.status == 'active' and timezone.now() < self.end_at

    def __str__(self):
        return f"{self.user.phone_number} - {self.plan.name}"


class Transaction(models.Model):
    """Payment transaction records"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
    )
    subscription = models.ForeignKey(UserSubscription, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_ref = models.CharField(max_length=100, unique=True)
    provider_ref = models.CharField(max_length=100, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='AFN')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    provider_response = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_ref} - {self.amount} {self.currency}"


class StreamingContent(models.Model):
    """Stream catalog and source data"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    stream_source = models.CharField(max_length=500)
    is_live = models.BooleanField(default=False)
    thumbnail_url = models.CharField(max_length=500, null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'streaming_contents'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['is_live']),
        ]

    def __str__(self):
        return self.title


class StreamSession(models.Model):
    """Stream preview and paid watch sessions"""
    SESSION_TYPE_CHOICES = [
        ('trial', 'Trial'),
        ('paid', 'Paid'),
        ('free', 'Free'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stream_sessions')
    content = models.ForeignKey(StreamingContent, on_delete=models.CASCADE)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES)
    expires_at = models.DateTimeField()
    signed_url = models.CharField(max_length=1000, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'stream_sessions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['content']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['status']),
        ]

    def is_active(self):
        return self.status == 'active' and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.user.phone_number} - {self.content.title}"


class Game(models.Model):
    """Game catalog metadata"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    game_source = models.CharField(max_length=500)
    thumbnail_url = models.CharField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'games'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.title


class GameSession(models.Model):
    """Game launch audit trail"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_sessions')
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    session_token = models.CharField(max_length=500)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'game_sessions'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['game']),
        ]

    def __str__(self):
        return f"{self.user.phone_number} - {self.game.title}"


class AuditLog(models.Model):
    """System audit trail for compliance and debugging"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.CharField(max_length=100)
    action = models.CharField(max_length=100)
    actor_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    metadata = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['module']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.module} - {self.action}"
