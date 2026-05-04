import { apiFetch, parseJsonOrThrow } from './client';

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  billing_period: string;
  entitlement_type: string;
  duration_hours: number;
  price_afn: string;
  currency: string;
  status: string;
  features: Record<string, unknown>;
  created_at: string;
  /** When signed in: server explains why checkout is blocked, or null if allowed. */
  purchase_block_reason?: string | null;
};

export type UserSubscriptionRow = {
  id: string;
  plan: SubscriptionPlan | null;
  status: string;
  start_at: string;
  end_at: string;
  entitlement_type: string;
  billing_period: string;
  price_paid_afn: string | null;
  plan_name_snapshot: string;
  purchase_phone_number: string;
  is_active: boolean;
  remaining_hours: number;
};

export type SubscriptionStatusResponse = {
  has_active_subscription: boolean;
  has_game_entitlement: boolean;
  has_streaming_entitlement: boolean;
  can_use_trial: boolean;
  active_subscriptions: UserSubscriptionRow[];
  eligible_plan_ids: string[];
};

export type PlanBrief = {
  id: string;
  name: string;
  billing_period: string;
  entitlement_type: string;
} | null;

export type PaymentTransactionRow = {
  id: string;
  plan: PlanBrief;
  subscription: string | null;
  transaction_ref: string;
  amount: string;
  currency: string;
  status: string;
  payment_method: string | null;
  created_at: string;
};

export async function fetchSubscriptionPlans(params?: {
  billing_period?: string;
  entitlement_type?: string;
  /** When true, only plans you are allowed to buy (requires auth). */
  eligible_for_me?: boolean;
}): Promise<SubscriptionPlan[]> {
  const q = new URLSearchParams();
  if (params?.billing_period) q.set('billing_period', params.billing_period);
  if (params?.entitlement_type) q.set('entitlement_type', params.entitlement_type);
  if (params?.eligible_for_me) q.set('eligible_for_me', '1');
  const qs = q.toString();
  const res = await apiFetch(`/api/v1/subscriptions/plans${qs ? `?${qs}` : ''}`);
  return parseJsonOrThrow(res) as Promise<SubscriptionPlan[]>;
}

export async function fetchPaymentHistory(): Promise<PaymentTransactionRow[]> {
  const res = await apiFetch('/api/v1/payments/history');
  return parseJsonOrThrow(res) as Promise<PaymentTransactionRow[]>;
}

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const res = await apiFetch('/api/v1/subscriptions/status');
  return parseJsonOrThrow(res) as Promise<SubscriptionStatusResponse>;
}

export async function fetchSubscriptionHistory(): Promise<UserSubscriptionRow[]> {
  const res = await apiFetch('/api/v1/subscriptions/me');
  return parseJsonOrThrow(res) as Promise<UserSubscriptionRow[]>;
}

export type PurchasePlanResponse = {
  transaction_ref: string;
  plan_id: string;
  amount: string;
  currency: string;
  plan_name: string;
  checkout_token: string;
  palzio_checkout_path: string;
  redirect_url: string;
};

export async function purchasePlan(planId: string): Promise<PurchasePlanResponse> {
  const res = await apiFetch('/api/v1/subscriptions/purchase', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId }),
  });
  return parseJsonOrThrow(res) as Promise<PurchasePlanResponse>;
}

export async function demoConfirmPayment(transactionRef: string): Promise<unknown> {
  const res = await apiFetch('/api/v1/payments/demo-confirm', {
    method: 'POST',
    body: JSON.stringify({ transaction_ref: transactionRef }),
  });
  return parseJsonOrThrow(res);
}

export async function cancelSubscription(subscriptionId: string): Promise<UserSubscriptionRow> {
  const res = await apiFetch(`/api/v1/subscriptions/me/${subscriptionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
  return parseJsonOrThrow(res) as Promise<UserSubscriptionRow>;
}
