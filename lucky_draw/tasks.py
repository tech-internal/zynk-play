"""
Celery task: auto-run lucky draws when end_date passes.
"""
import logging

from celery import shared_task
from django.utils import timezone

from .models import LuckyDraw
from .services.draw import run_lucky_draw

logger = logging.getLogger(__name__)


@shared_task(name='lucky_draw.tasks.process_lucky_draws')
def process_lucky_draws():
    """Run draws for open lucky draws whose end_date has passed."""
    now = timezone.now()
    due = LuckyDraw.objects.filter(status='open', end_date__lte=now).order_by('end_date')[:50]

    processed = 0
    for draw in due:
        try:
            run_lucky_draw(draw_id=draw.id, triggered_by='auto')
            processed += 1
        except Exception:
            logger.exception('Failed to process lucky draw %s', draw.id)

    logger.info('Lucky draw auto-run processed %s draws', processed)
    return processed
