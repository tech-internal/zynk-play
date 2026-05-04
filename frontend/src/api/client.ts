import { getAccessToken } from '../utils/authSession';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:8000';

function formatError(data: Record<string, unknown>): string {
  if (typeof data.detail === 'string') return data.detail;
  const first = Object.values(data)[0];
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  if (typeof first === 'string') return first;
  if (typeof data.error === 'string') {
    if (typeof data.code === 'string') return `${data.error} (${data.code})`;
    return data.error;
  }
  if (typeof data.code === 'string') return data.code;
  return 'Something went wrong';
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function parseJsonOrThrow(res: Response): Promise<unknown> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(formatError(data));
  }
  return data;
}

export { API_BASE };
