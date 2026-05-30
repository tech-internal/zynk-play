from django.contrib import admin

from .models import LuckyDraw, LuckyDrawEntry, LuckyDrawWinner


@admin.register(LuckyDraw)
class LuckyDrawAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'category',
        'status',
        'entry_xp',
        'participant_count',
        'max_participants',
        'end_date',
        'drawn_at',
    )
    list_filter = ('status', 'category')
    search_fields = ('title', 'prize_title')
    raw_id_fields = ('created_by',)
    readonly_fields = ('participant_count', 'drawn_at', 'created_at', 'updated_at')


@admin.register(LuckyDrawEntry)
class LuckyDrawEntryAdmin(admin.ModelAdmin):
    list_display = ('lucky_draw', 'user', 'entered_at')
    raw_id_fields = ('lucky_draw', 'user', 'xp_transaction')


@admin.register(LuckyDrawWinner)
class LuckyDrawWinnerAdmin(admin.ModelAdmin):
    list_display = ('lucky_draw', 'user', 'rank', 'announced_at')
    raw_id_fields = ('lucky_draw', 'user', 'entry')
