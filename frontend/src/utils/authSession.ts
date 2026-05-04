export const MOCK_AUTH_KEY = 'mockAuth';

export type AuthSession = {
  phone_number: string;
  loggedIn: boolean;
  country_code?: string;
  access_token?: string | null;
  refresh_token?: string | null;
  user_id?: string | null;
};

export function getMockAuthSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(MOCK_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.loggedIn || !parsed.phone_number) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  const s = getMockAuthSession();
  return s?.access_token ?? null;
}

export function isAuthenticated(): boolean {
  const s = getMockAuthSession();
  return Boolean(s?.loggedIn && s?.phone_number && s?.access_token);
}

export function saveMockAuthSession(session: AuthSession): void {
  sessionStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(session));
}

export function clearMockAuthSession(): void {
  sessionStorage.removeItem(MOCK_AUTH_KEY);
}
