const KEY        = 'pos_token';
const EXPIRY_KEY = 'pos_token_expiry';

const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export function setToken(token: string, remember: boolean): void {
  if (remember) {
    localStorage.setItem(KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + REMEMBER_TTL_MS));
    sessionStorage.removeItem(KEY);
  } else {
    sessionStorage.setItem(KEY, token);
    localStorage.removeItem(KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
}

export function getToken(): string | null {
  const lsToken = localStorage.getItem(KEY);
  if (lsToken) {
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? 0);
    if (Date.now() > expiry) {
      // "Remember me" window expired — clean up and force re-login
      localStorage.removeItem(KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return lsToken;
  }
  return sessionStorage.getItem(KEY);
}

export function clearToken(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(EXPIRY_KEY);
  sessionStorage.removeItem(KEY);
}
