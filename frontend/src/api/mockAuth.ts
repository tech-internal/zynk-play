const API_BASE = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:8000';

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

export async function mockVerifyOtp(
  phone_number: string,
  otp_code: string
): Promise<{ message: string; success: boolean; phone_number: string }> {
  const res = await fetch(`${API_BASE}/api/v1/mock/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number, otp_code }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(formatError(data));
  return data as { message: string; success: boolean; phone_number: string };
}
