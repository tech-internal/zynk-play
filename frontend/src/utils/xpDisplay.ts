import type { XpCategory, XpRule, XpTransaction } from '../api/xp';

export const EARN_CATEGORY_ORDER: XpCategory[] = ['watch', 'platform', 'win', 'share', 'pay'];

export function formatXpCompact(value: number): string {
  const n = Math.max(0, Math.round(value));
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function formatXpPill(value: number): string {
  return `⚡ ${formatXpCompact(value)}`;
}

export function humanizeEventCode(code: string): string {
  return code
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRuleXpLabel(rule: XpRule): string {
  if (rule.xp_formula_type === 'percentage') {
    const pct = rule.xp_formula_param?.percent;
    if (typeof pct === 'number') return `+${pct}% XP`;
  }
  if (rule.xp_formula_type === 'per_unit') {
    const rate = rule.xp_formula_param?.rate;
    const unit = rule.xp_formula_param?.unit;
    if (typeof rate === 'number') {
      const unitLabel = typeof unit === 'string' ? unit.replace(/_/g, ' ') : 'unit';
      return `+${rate} XP / ${unitLabel}`;
    }
  }
  return `+${rule.base_xp} XP`;
}

export function categoryIconClass(category: XpCategory): string {
  const map: Record<XpCategory, string> = {
    watch: 'earn-icon--red',
    platform: 'earn-icon--cyan',
    win: 'earn-icon--gold',
    share: 'earn-icon--purple',
    pay: 'earn-icon--orange',
  };
  return map[category] ?? 'earn-icon--cyan';
}

export function categoryEmoji(category: XpCategory, eventCode: string): string {
  if (eventCode.startsWith('WATCH_')) return '📺';
  if (eventCode.startsWith('SHARE_')) return '📲';
  if (eventCode.startsWith('LOGIN_') || eventCode.startsWith('PROFILE_') || eventCode.startsWith('REFERRAL_')) {
    return '⭐';
  }
  if (eventCode.startsWith('WIN_')) return '🏆';
  if (eventCode.startsWith('PAY_')) return '💳';
  return { watch: '📺', platform: '⭐', win: '🏆', share: '📲', pay: '💳' }[category] ?? '⚡';
}

export function routeForXpCategory(category: XpCategory): string | undefined {
  switch (category) {
    case 'watch':
      return '/streaming';
    case 'win':
      return '/gameplay';
    case 'share':
      return '/earn-share?view=share';
    case 'pay':
      return '/subscription';
    case 'platform':
      return '/profile';
    default:
      return undefined;
  }
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

export function isRuleCompleted(rule: XpRule, credits: XpTransaction[]): boolean {
  const forEvent = credits.filter(
    (t) => t.event_code === rule.event_code && t.transaction_type === 'credit' && t.status === 'confirmed',
  );
  if (forEvent.length === 0) return false;

  if (rule.max_per_lifetime === 1) return true;

  if (rule.daily_cap_xp != null && rule.daily_cap_xp > 0) {
    const todaySum = forEvent
      .filter((t) => isToday(t.occurred_at || t.created_at))
      .reduce((sum, t) => sum + Math.max(0, t.xp_amount), 0);
    return todaySum >= rule.daily_cap_xp;
  }

  return false;
}

export function sumXpToday(credits: XpTransaction[]): number {
  return credits
    .filter((t) => t.transaction_type === 'credit' && t.status === 'confirmed' && isToday(t.occurred_at || t.created_at))
    .reduce((sum, t) => sum + Math.max(0, t.xp_amount), 0);
}

export function groupRulesByCategory(rules: XpRule[]): Record<XpCategory, XpRule[]> {
  const grouped = {} as Record<XpCategory, XpRule[]>;
  for (const cat of EARN_CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const rule of rules) {
    if (!rule.is_active) continue;
    const cat = rule.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(rule);
  }
  for (const cat of EARN_CATEGORY_ORDER) {
    grouped[cat].sort((a, b) => b.base_xp - a.base_xp);
  }
  return grouped;
}
