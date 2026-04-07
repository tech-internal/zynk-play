# entertainment_platform/admin.py
from django.contrib import admin
from .models import (
    User, OTPRequest, SubscriptionPlan, UserSubscription,
    Transaction, StreamingContent, StreamSession, Game, GameSession, AuditLog
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'status', 'free_trial_used', 'last_login_at')
    list_filter = ('status', 'free_trial_used')
    search_fields = ('phone_number',)

@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'status', 'expires_at', 'attempts')
    list_filter = ('status', 'created_at')

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_hours', 'price_afn', 'status')
    list_filter = ('status',)

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'start_at', 'end_at')
    list_filter = ('status', 'plan')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_ref', 'user', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('transaction_ref', 'provider_ref')

@admin.register(StreamingContent)
class StreamingContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_live', 'status')
    list_filter = ('status', 'is_live', 'category')
    search_fields = ('title',)

@admin.register(StreamSession)
class StreamSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'session_type', 'expires_at', 'status')
    list_filter = ('status', 'session_type')

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status')
    list_filter = ('status', 'category')
    search_fields = ('title',)

@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'started_at', 'ended_at')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('module', 'action', 'actor_user', 'created_at')
    list_filter = ('module', 'action', 'created_at')
    readonly_fields = ('created_at',)
