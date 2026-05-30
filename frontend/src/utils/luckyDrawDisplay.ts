import type { LuckyDraw, LuckyDrawCategory } from '../api/luckyDraw';

export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

export function getCountdown(endDateIso: string, now = Date.now()): CountdownParts {
  const totalMs = new Date(endDateIso).getTime() - now;
  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const seconds = Math.floor(totalMs / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { totalMs, days, hours, minutes, seconds: secs, expired: false };
}

export function formatCountdown(parts: CountdownParts): string {
  if (parts.expired) return '00:00:00';
  if (parts.days > 0) {
    return `${parts.days}d ${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}:${String(parts.seconds).padStart(2, '0')}`;
  }
  return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}:${String(parts.seconds).padStart(2, '0')}`;
}

export function slotsRemaining(draw: LuckyDraw): number {
  return Math.max(0, draw.max_participants - draw.participant_count);
}

export function slotsFillPercent(draw: LuckyDraw): number {
  if (draw.max_participants <= 0) return 0;
  return Math.min(100, Math.round((draw.participant_count / draw.max_participants) * 100));
}

export function categoryIcon(category: LuckyDrawCategory): string {
  const map: Record<LuckyDrawCategory, string> = {
    electronics: 'headphones',
    subscription: 'workspace_premium',
    merch: 'apparel',
    platform: 'stars',
    other: 'redeem',
  };
  return map[category] ?? 'redeem';
}

export function categoryAccentClass(category: LuckyDrawCategory): string {
  const map: Record<LuckyDrawCategory, string> = {
    electronics: 'ld-card--gold',
    subscription: 'ld-card--green',
    merch: 'ld-card--red',
    platform: 'ld-card--gold',
    other: 'ld-card--neutral',
  };
  return map[category] ?? 'ld-card--neutral';
}
