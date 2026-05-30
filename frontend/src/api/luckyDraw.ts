import { apiFetch } from './client';
import { getAuthUserId } from './xp';

export type LuckyDrawCategory = 'electronics' | 'subscription' | 'merch' | 'platform' | 'other';

export type LuckyDrawStatus = 'draft' | 'open' | 'closed' | 'drawn' | 'cancelled';

export type LuckyDrawWinner = {
  rank: number;
  user_id: string;
  display_name: string;
  entry_id?: string;
};

export type LuckyDraw = {
  id: string;
  title: string;
  description: string;
  category: LuckyDrawCategory;
  prize_title: string;
  prize_description: string;
  prize_image_url: string;
  entry_xp: number;
  end_date: string;
  max_participants: number;
  winner_count: number;
  participant_count: number;
  status: LuckyDrawStatus;
  drawn_at: string | null;
  created_at: string;
  is_accepting_entries: boolean;
  user_entered?: boolean;
  winners?: LuckyDrawWinner[];
};

export type LuckyDrawAnnouncement = {
  draw_id: string;
  title: string;
  prize_title: string;
  category: LuckyDrawCategory;
  drawn_at: string | null;
  winners: Array<{ rank: number; display_name: string; user_id: string }>;
};

export type EnterLuckyDrawResult = {
  entry_id: string;
  xp_deducted: number;
  new_balance: number;
  participant_count: number;
  draw_status: LuckyDrawStatus;
  auto_drawn?: boolean;
  winners?: LuckyDrawWinner[];
};

type LuckyDrawEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
};

function luckyDrawErrorMessage(body: LuckyDrawEnvelope<unknown>, fallback: string): string {
  if (body.error?.message) return body.error.message;
  return fallback;
}

async function parseLuckyDrawJson<T>(res: Response, fallback: string): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as LuckyDrawEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(luckyDrawErrorMessage(body, fallback));
  }
  return body.data as T;
}

export async function fetchLuckyDraws(params: {
  status?: LuckyDrawStatus;
  category?: LuckyDrawCategory;
  mine?: boolean;
} = {}): Promise<LuckyDraw[]> {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.category) q.set('category', params.category);
  if (params.mine) q.set('mine', 'true');
  const qs = q.toString();
  const res = await apiFetch(`/api/v1/lucky-draws${qs ? `?${qs}` : ''}`);
  const data = await parseLuckyDrawJson<{ items: LuckyDraw[] }>(res, 'Could not load lucky draws');
  return data.items ?? [];
}

export async function fetchLuckyDrawAnnouncements(): Promise<LuckyDrawAnnouncement[]> {
  const res = await apiFetch('/api/v1/lucky-draws/announcements?per_page=5');
  const data = await parseLuckyDrawJson<{ items: LuckyDrawAnnouncement[] }>(
    res,
    'Could not load announcements',
  );
  return data.items ?? [];
}

export function enterIdempotencyKey(drawId: string): string {
  const userId = getAuthUserId() ?? 'anon';
  return `lucky-draw-enter-${drawId}-${userId}`;
}

export async function enterLuckyDraw(drawId: string): Promise<EnterLuckyDrawResult> {
  const res = await apiFetch(`/api/v1/lucky-draws/${drawId}/enter`, {
    method: 'POST',
    body: JSON.stringify({ idempotency_key: enterIdempotencyKey(drawId) }),
  });
  return parseLuckyDrawJson<EnterLuckyDrawResult>(res, 'Could not enter lucky draw');
}
