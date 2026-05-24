from django.contrib import admin

from .models import XPAuditLog, XPEvent, XPRedemptionItem, XPRule, XPTransaction, UserXPWallet


@admin.register(XPEvent)
class XPEventAdmin(admin.ModelAdmin):
    list_display = ('event_code', 'category', 'is_active', 'requires_verification')
    list_filter = ('category', 'is_active')
    search_fields = ('event_code', 'description')


@admin.register(XPRule)
class XPRuleAdmin(admin.ModelAdmin):
    list_display = ('rule_name', 'event', 'base_xp', 'is_active', 'daily_cap_xp', 'cooldown_seconds')
    list_filter = ('is_active', 'xp_formula_type')
    raw_id_fields = ('event', 'created_by')


@admin.register(UserXPWallet)
class UserXPWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'available_xp', 'total_xp_earned', 'xp_tier', 'updated_at')
    list_filter = ('xp_tier',)
    raw_id_fields = ('user',)


@admin.register(XPTransaction)
class XPTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'transaction_type', 'xp_amount', 'status', 'created_at',
    )
    list_filter = ('transaction_type', 'status')
    search_fields = ('idempotency_key',)
    raw_id_fields = ('user', 'event', 'rule', 'parent_transaction')


@admin.register(XPRedemptionItem)
class XPRedemptionItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'xp_cost', 'is_active')


@admin.register(XPAuditLog)
class XPAuditLogAdmin(admin.ModelAdmin):
    list_display = ('action_type', 'target_entity', 'actor_label', 'created_at')
    list_filter = ('action_type',)
