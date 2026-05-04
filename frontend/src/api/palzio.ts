import { API_BASE, parseJsonOrThrow } from './client';

export type PalzioOutcome = 'success' | 'failed' | 'insufficient_balance' | 'user_dropped';
export type PalzioMethod = 'card' | 'upi' | 'wallet';

const TOKEN_KEY = (ref: string) => `palzio_checkout_token:${ref}`;

export function storePalzioCheckoutToken(transactionRef: string, checkoutToken: string): void {
  sessionStorage.setItem(TOKEN_KEY(transactionRef), checkoutToken);
}

export function readPalzioCheckoutToken(transactionRef: string): string | null {
  return sessionStorage.getItem(TOKEN_KEY(transactionRef));
}

export function clearPalzioCheckoutToken(transactionRef: string): void {
  sessionStorage.removeItem(TOKEN_KEY(transactionRef));
}

export type PalzioCompleteResponse = {
  ok: boolean;
  outcome: PalzioOutcome;
  platform_status: number;
  platform: Record<string, unknown>;
};

export async function palzioCompletePayment(body: {
  transaction_ref: string;
  checkout_token: string;
  outcome: PalzioOutcome;
  payment_method: PalzioMethod;
}): Promise<PalzioCompleteResponse> {
  const res = await fetch(`${API_BASE}/psp/api/v1/complete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJsonOrThrow(res) as Promise<PalzioCompleteResponse>;
}
