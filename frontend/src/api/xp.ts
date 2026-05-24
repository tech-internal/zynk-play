import { apiFetch } from './client';
import { getMockAuthSession } from '../utils/authSession';

export type XpCategory = 'watch' | 'pay' | 'win' | 'share' | 'platform';

export type XpRule = {
  id: string;
  event: string;
  event_code: string;
  category: XpCategory;
  rule_name: string;
  base_xp: number;
  xp_formula_type: 'flat' | 'percentage' | 'per_unit' | string;
  xp_formula_param: Record<string, unknown>;
  daily_cap_xp: number | null;
  global_daily_cap: number | null;
  cooldown_seconds: number;
  max_per_lifetime: number | null;
  expiry_days: number;
  is_active: boolean;
};

export type XpBalance = {
  user_id: string;
  available_xp: number;
  total_xp_earned: number;
  redeemed_xp: number;
  expired_xp: number;
  current_tier: string;
  next_tier: string | null;
  xp_to_next_tier: number | null;
  expiring_soon: Array<{ xp_amount: number; expires_at: string }>;
};

export type XpTransaction = {
  id: string;
  idempotency_key: string;
  user_id: string;
  event_code: string | null;
  category: XpCategory | null;
  transaction_type: 'credit' | 'debit' | 'expire' | 'bonus' | 'reversal' | string;
  xp_amount: number;
  base_xp: number | null;
  multiplier_applied: number | null;
  balance_before: number;
  balance_after: number;
  status: string;
  source_metadata: Record<string, unknown>;
  expires_at: string | null;
  is_expired: boolean;
  occurred_at: string;
  created_at: string;
};

type XpEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
};

export type XpTransactionsParams = {
  page?: number;
  per_page?: number;
  transaction_type?: string;
  category?: XpCategory;
  from_date?: string;
  to_date?: string;
};

export type XpRulesParams = {
  category?: XpCategory;
  is_active?: boolean;
};

function xpErrorMessage(body: XpEnvelope<unknown>, fallback: string): string {
  if (body.error?.message) return body.error.message;
  return fallback;
}

async function parseXpJson<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as XpEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(xpErrorMessage(body, fallback));
  }
  return body.data as T;
}

export function getAuthUserId(): string | null {
  return getMockAuthSession()?.user_id ?? null;
}

export async function fetchXpBalance(userId: string): Promise<XpBalance> {
  const res = await apiFetch(`/api/v1/xp/balance?user_id=${encodeURIComponent(userId)}`);
  return parseXpJson<XpBalance>(res, 'Could not load XP balance');
}

export async function fetchXpRules(params: XpRulesParams = {}): Promise<XpRule[]> {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  if (params.is_active !== undefined) q.set('is_active', String(params.is_active));
  const qs = q.toString();
  const res = await apiFetch(`/api/v1/xp/rules${qs ? `?${qs}` : ''}`);
  const data = await parseXpJson<{ items: XpRule[]; count: number }>(res, 'Could not load XP rules');
  return data.items ?? [];
}

export async function fetchXpTransactions(
  userId: string,
  params: XpTransactionsParams = {},
): Promise<{ items: XpTransaction[]; page: number; per_page: number; total: number }> {
  const q = new URLSearchParams({ user_id: userId });
  if (params.page) q.set('page', String(params.page));
  if (params.per_page) q.set('per_page', String(params.per_page));
  if (params.transaction_type) q.set('transaction_type', params.transaction_type);
  if (params.category) q.set('category', params.category);
  if (params.from_date) q.set('from_date', params.from_date);
  if (params.to_date) q.set('to_date', params.to_date);

  const res = await apiFetch(`/api/v1/xp/transactions?${q.toString()}`);
  return parseXpJson(res, 'Could not load XP transactions');
}

/** Fetch up to `maxPages` of transactions (for completion checks). */
export type TriggerXpResult = {
  transaction_id: string;
  xp_awarded: number;
  base_xp?: number;
  multiplier?: number;
  new_balance: number;
  expires_at?: string | null;
  tier_updated?: boolean;
  current_tier?: string;
};

export function dailyIdempotencyKey(prefix: string, userId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${prefix}-${userId}-${day}`;
}

export async function triggerXpEvent(payload: {
  event_code: string;
  user_id: string;
  idempotency_key: string;
  occurred_at?: string;
  source_metadata?: Record<string, unknown>;
  unit_count?: number;
}): Promise<TriggerXpResult> {
  const res = await apiFetch('/api/v1/xp/trigger-event', {
    method: 'POST',
    body: JSON.stringify({
      event_code: payload.event_code,
      user_id: payload.user_id,
      idempotency_key: payload.idempotency_key,
      occurred_at: payload.occurred_at ?? new Date().toISOString(),
      source_metadata: payload.source_metadata ?? {},
      unit_count: payload.unit_count ?? 1,
    }),
  });
  return parseXpJson<TriggerXpResult>(res, 'Could not award XP');
}

/** Awards daily login XP once per UTC day (safe to call on every app open). */
export async function awardDailyLoginXp(userId: string): Promise<TriggerXpResult | null> {
  try {
    return await triggerXpEvent({
      event_code: 'LOGIN_DAILY',
      user_id: userId,
      idempotency_key: dailyIdempotencyKey('login-daily', userId),
      source_metadata: { source: 'fanverse_app', action: 'login' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message.toLowerCase() : '';
    if (
      msg.includes('daily cap') ||
      msg.includes('cooldown') ||
      msg.includes('xp_daily') ||
      msg.includes('xp_cooldown')
    ) {
      return null;
    }
    throw e;
  }
}

export async function fetchAllXpTransactions(
  userId: string,
  params: Omit<XpTransactionsParams, 'page'> = {},
  maxPages = 5,
): Promise<XpTransaction[]> {
  const perPage = params.per_page ?? 100;
  const all: XpTransaction[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await fetchXpTransactions(userId, { ...params, page, per_page: perPage });
    all.push(...batch.items);
    if (all.length >= batch.total || batch.items.length < perPage) break;
  }
  return all;
}
