import uuid

from django.db import models
from django.utils import timezone

from entertainment_platform.models import User
from xp_management.models import XPTransaction


class LuckyDraw(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('drawn', 'Drawn'),
        ('cancelled', 'Cancelled'),
    ]
    CATEGORY_CHOICES = [
        ('electronics', 'Electronics'),
        ('subscription', 'Subscription'),
        ('merch', 'Merchandise'),
        ('platform', 'Platform'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='other')
    prize_title = models.CharField(max_length=200)
    prize_description = models.TextField(blank=True, default='')
    prize_image_url = models.URLField(blank=True, default='')
    entry_xp = models.PositiveIntegerField()
    end_date = models.DateTimeField()
    max_participants = models.PositiveIntegerField()
    winner_count = models.PositiveIntegerField(default=1)
    participant_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    drawn_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lucky_draws_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lucky_draws'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'end_date']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_accepting_entries(self):
        return (
            self.status == 'open'
            and timezone.now() < self.end_date
            and self.participant_count < self.max_participants
        )


class LuckyDrawEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lucky_draw = models.ForeignKey(LuckyDraw, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lucky_draw_entries')
    xp_transaction = models.ForeignKey(
        XPTransaction,
        on_delete=models.PROTECT,
        related_name='lucky_draw_entries',
    )
    entered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lucky_draw_entries'
        ordering = ['entered_at']
        constraints = [
            models.UniqueConstraint(fields=['lucky_draw', 'user'], name='unique_lucky_draw_entry_per_user'),
        ]
        indexes = [
            models.Index(fields=['lucky_draw', 'entered_at']),
        ]

    def __str__(self):
        return f'{self.user_id} -> {self.lucky_draw_id}'


class LuckyDrawWinner(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lucky_draw = models.ForeignKey(LuckyDraw, on_delete=models.CASCADE, related_name='winners')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lucky_draw_wins')
    entry = models.ForeignKey(LuckyDrawEntry, on_delete=models.PROTECT, related_name='win_records')
    rank = models.PositiveIntegerField(default=1)
    announced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lucky_draw_winners'
        ordering = ['rank']
        constraints = [
            models.UniqueConstraint(fields=['lucky_draw', 'rank'], name='unique_lucky_draw_winner_rank'),
            models.UniqueConstraint(fields=['lucky_draw', 'user'], name='unique_lucky_draw_winner_user'),
        ]

    def __str__(self):
        return f'#{self.rank} {self.user_id} ({self.lucky_draw_id})'
