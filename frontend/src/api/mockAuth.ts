import { API_BASE } from './client';

function formatError(data: Record<string, unknown>): string {
  if (typeof data.detail === 'string') return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  if (typeof first === 'string') return first;
  if (typeof data.error === 'string') return data.error;
  return 'Something went wrong';
}

export async function mockSendOtp(phone_number: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/mock/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(formatError(data));
  return data as { message: string };
}

export type MockVerifySuccess = {
  message: string;
  success: boolean;
  phone_number: string;
  access: string;
  refresh: string;
  user: { id: string; phone_number: string; has_game_entitlement?: boolean; has_streaming_entitlement?: boolean };
};

export async function mockVerifyOtp(phone_number: string, otp_code: string): Promise<MockVerifySuccess> {
  const res = await fetch(`${API_BASE}/api/v1/mock/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number, otp_code }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(formatError(data));
  return data as unknown as MockVerifySuccess;
}
