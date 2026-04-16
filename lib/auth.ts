const TOKEN_KEY = 'tt_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Also set a cookie so Next.js middleware (Edge runtime) can read it
  document.cookie = `tt_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'tt_token=; path=/; max-age=0';
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
