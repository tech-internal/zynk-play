export const MOCK_AUTH_KEY = 'mockAuth';

export type MockAuthSession = {
  phone_number: string;
  loggedIn: boolean;
  country_code?: string;
};

export function getMockAuthSession(): MockAuthSession | null {
  try {
    const raw = sessionStorage.getItem(MOCK_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockAuthSession;
    if (!parsed.loggedIn || !parsed.phone_number) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getMockAuthSession());
}

export function saveMockAuthSession(session: MockAuthSession): void {
  sessionStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(session));
}

export function clearMockAuthSession(): void {
  sessionStorage.removeItem(MOCK_AUTH_KEY);
}
