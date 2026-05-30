from rest_framework import serializers

from .models import LuckyDraw


class LuckyDrawCreateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=['draft', 'open'],
        default='draft',
        required=False,
    )

    class Meta:
        model = LuckyDraw
        fields = [
            'title',
            'description',
            'category',
            'prize_title',
            'prize_description',
            'prize_image_url',
            'entry_xp',
            'end_date',
            'max_participants',
            'winner_count',
            'status',
        ]

    def validate_entry_xp(self, value):
        if value <= 0:
            raise serializers.ValidationError('entry_xp must be greater than 0')
        return value

    def validate_max_participants(self, value):
        if value <= 0:
            raise serializers.ValidationError('max_participants must be greater than 0')
        return value

    def validate_winner_count(self, value):
        if value <= 0:
            raise serializers.ValidationError('winner_count must be greater than 0')
        return value

    def validate(self, attrs):
        winner_count = attrs.get('winner_count', 1)
        max_participants = attrs.get('max_participants')
        if max_participants and winner_count > max_participants:
            raise serializers.ValidationError(
                {'winner_count': 'winner_count cannot exceed max_participants'}
            )
        return attrs


class LuckyDrawUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=['draft', 'open', 'closed'],
        required=False,
    )

    class Meta:
        model = LuckyDraw
        fields = [
            'title',
            'description',
            'category',
            'prize_title',
            'prize_description',
            'prize_image_url',
            'entry_xp',
            'end_date',
            'max_participants',
            'winner_count',
            'status',
        ]
        extra_kwargs = {
            'title': {'required': False},
            'description': {'required': False},
            'category': {'required': False},
            'prize_title': {'required': False},
            'prize_description': {'required': False},
            'prize_image_url': {'required': False},
            'entry_xp': {'required': False},
            'end_date': {'required': False},
            'max_participants': {'required': False},
            'winner_count': {'required': False},
            'status': {'required': False},
        }

    def validate_entry_xp(self, value):
        if value <= 0:
            raise serializers.ValidationError('entry_xp must be greater than 0')
        return value

    def validate_max_participants(self, value):
        if value <= 0:
            raise serializers.ValidationError('max_participants must be greater than 0')
        return value

    def validate_winner_count(self, value):
        if value <= 0:
            raise serializers.ValidationError('winner_count must be greater than 0')
        return value


class LuckyDrawEnterSerializer(serializers.Serializer):
    idempotency_key = serializers.CharField(max_length=200)


class LuckyDrawCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')
