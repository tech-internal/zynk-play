import uuid
from decimal import Decimal

from django.db import models
from django.utils import timezone

from entertainment_platform.models import User


class XPEvent(models.Model):
    CATEGORY_CHOICES = [
        ('watch', 'Watch'),
        ('pay', 'Pay'),
        ('win', 'Win'),
        ('share', 'Share'),
        ('platform', 'Platform'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_code = models.CharField(max_length=100, unique=True, db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    requires_verification = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xp_events'
        ordering = ['event_code']

    def __str__(self):
        return self.event_code


class XPRule(models.Model):
    FORMULA_CHOICES = [
        ('flat', 'Flat'),
        ('per_unit', 'Per Unit'),
        ('percentage', 'Percentage'),
        ('tiered', 'Tiered'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(XPEvent, on_delete=models.PROTECT, related_name='rules')
    rule_name = models.CharField(max_length=150)
    base_xp = models.IntegerField()
    xp_formula_type = models.CharField(max_length=20, choices=FORMULA_CHOICES, default='flat')
    xp_formula_param = models.JSONField(default=dict, blank=True)
    daily_cap_xp = models.IntegerField(null=True, blank=True)
    global_daily_cap = models.IntegerField(null=True, blank=True)
    cooldown_seconds = models.IntegerField(default=0)
    max_per_lifetime = models.IntegerField(null=True, blank=True)
    expiry_days = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='xp_rules_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'xp_rules'
        ordering = ['-created_at']

    def __str__(self):
        return self.rule_name

    def is_valid_now(self, at=None):
        at = at or timezone.now()
        if not self.is_active:
            return False
        if self.valid_from and at < self.valid_from:
            return False
        if self.valid_until and at >= self.valid_until:
            return False
        return True


class UserXPWallet(models.Model):
    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
        ('diamond', 'Diamond'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='xp_wallet')
    total_xp_earned = models.BigIntegerField(default=0)
    available_xp = models.BigIntegerField(default=0)
    redeemed_xp = models.BigIntegerField(default=0)
    expired_xp = models.BigIntegerField(default=0)
    xp_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='bronze')
    tier_updated_at = models.DateTimeField(null=True, blank=True)
    version = models.IntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_xp_wallet'

    def __str__(self):
        return f'Wallet {self.user_id}'


class XPTransaction(models.Model):
    TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
        ('expire', 'Expire'),
        ('bonus', 'Bonus'),
        ('reversal', 'Reversal'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.CharField(max_length=200, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='xp_transactions')
    event = models.ForeignKey(XPEvent, on_delete=models.PROTECT, null=True, blank=True, related_name='transactions')
    rule = models.ForeignKey(XPRule, on_delete=models.PROTECT, null=True, blank=True, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    xp_amount = models.IntegerField()
    base_xp = models.IntegerField(default=0)
    multiplier_applied = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.00'))
    balance_before = models.BigIntegerField()
    balance_after = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    source_metadata = models.JSONField(default=dict, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_expired = models.BooleanField(default=False)
    parent_transaction = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_transactions'
    )
    occurred_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xp_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', 'rule', 'created_at']),
            models.Index(fields=['expires_at', 'status', 'is_expired']),
        ]

    def __str__(self):
        return f'{self.transaction_type} {self.xp_amount} ({self.id})'


class XPRedemptionItem(models.Model):
    """Catalog items for POST /redeem."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    xp_cost = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xp_redemption_items'

    def __str__(self):
        return self.name


class XPAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='xp_audit_actions'
    )
    actor_label = models.CharField(max_length=100, default='system')
    action_type = models.CharField(max_length=80)
    target_entity = models.CharField(max_length=80)
    target_id = models.UUIDField(null=True, blank=True)
    before_state = models.JSONField(default=dict, blank=True)
    after_state = models.JSONField(default=dict, blank=True)
    request_id = models.CharField(max_length=64, blank=True, default='')
    source_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xp_audit_logs'
        ordering = ['-created_at']
