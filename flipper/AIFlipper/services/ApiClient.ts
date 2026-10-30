import { Config } from '../constants/Config';
import { AuthResponse } from '@flipper/shared';
import { loadTokens, saveTokens, clearTokens, StoredTokens } from './tokenStore';

// The single place the app talks to the backend. Before this, five screens each
// hand-rolled fetch with a retyped Content-Type header, no timeout, no auth, and
// no error normalization. ApiClient centralizes all of that:
//   - attaches `Authorization: Bearer <access token>`
//   - on a 401, transparently refreshes once and retries (single-flight, so ten
//     concurrent screen loads trigger one refresh, not ten)
//   - applies a request timeout
//   - throws a typed ApiError so screens can show a real message
//
// It holds the tokens in memory (seeded from secure storage at startup) so the
// hot path doesn't hit the keychain on every request.

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Raised when refresh fails / there is no valid session. The AuthContext listens
// for this to drop the user back to the login screen.
export class SessionExpiredError extends ApiError {
  constructor(message = 'Your session has expired. Please sign in again.') {
    super(401, message);
    this.name = 'SessionExpiredError';
  }
}

type TokenChangeListener = (tokens: StoredTokens | null) => void;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;
const listeners = new Set<TokenChangeListener>();

// AuthContext subscribes so a background refresh or a forced logout keeps React
// state and secure storage in sync with what ApiClient is actually sending.
export const onTokenChange = (listener: TokenChangeListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = (tokens: StoredTokens | null) => {
  for (const l of listeners) l(tokens);
};

// Seed the in-memory tokens from secure storage on app start.
export const initTokens = async (): Promise<StoredTokens | null> => {
  const stored = await loadTokens();
  accessToken = stored?.accessToken ?? null;
  refreshToken = stored?.refreshToken ?? null;
  return stored;
};

export const setSession = async (tokens: StoredTokens): Promise<void> => {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await saveTokens(tokens);
  emit(tokens);
};

export const clearSession = async (): Promise<void> => {
  accessToken = null;
  refreshToken = null;
  await clearTokens();
  emit(null);
};

const timeoutSignal = (ms: number): { signal: AbortSignal; cancel: () => void } => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
};

// Low-level fetch with timeout + JSON parsing + typed errors. No auth logic here.
const rawRequest = async <T>(
  path: string,
  options: RequestInit,
  token: string | null
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const { signal, cancel } = timeoutSignal(REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${Config.API_URL}${path}`, { ...options, headers, signal });
  } catch (err: any) {
    cancel();
    if (err?.name === 'AbortError') throw new ApiError(0, 'The request timed out. Check your connection.');
    throw new ApiError(0, 'Network error. Is the server reachable?');
  }
  cancel();

  const text = await response.text();
  const body = text ? safeJson(text) : null;

  if (!response.ok) {
    const message = (body && typeof body.error === 'string' && body.error) || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return body as T;
};

const safeJson = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Exchange the refresh token for a new pair. Single-flight: concurrent callers
// share one in-flight refresh so a burst of 401s doesn't fire N refreshes.
const refreshAccessToken = async (): Promise<string> => {
  if (refreshInFlight) return refreshInFlight;
  if (!refreshToken) throw new SessionExpiredError();

  refreshInFlight = (async () => {
    try {
      const result = await rawRequest<AuthResponse>(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({ refreshToken }) },
        null
      );
      await setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      return result.accessToken;
    } catch {
      // Refresh token is invalid/expired — the session is truly over.
      await clearSession();
      throw new SessionExpiredError();
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

// The method screens actually call. Attaches the current access token; on a 401
// (expired access token) it refreshes once and retries the request exactly once.
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  try {
    return await rawRequest<T>(path, options, accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && refreshToken) {
      const fresh = await refreshAccessToken(); // throws SessionExpiredError if it fails
      return rawRequest<T>(path, options, fresh);
    }
    throw err;
  }
};

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// --- Auth endpoints (no token attached; these mint the tokens) ---
export const authApi = {
  register: (email: string, password: string) =>
    rawRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }, null),
  login: (email: string, password: string) =>
    rawRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, null),
};
