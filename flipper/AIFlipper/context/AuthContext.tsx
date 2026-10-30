import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from '@flipper/shared';
import {
  api,
  authApi,
  initTokens,
  setSession,
  clearSession,
  onTokenChange,
} from '../services/ApiClient';
import { setInventoryCacheScope } from '../database/db';

// The app's single source of truth for "is someone signed in". The navigator
// gates on `token`; screens read `user` and call login/register/logout. Because
// ApiClient owns the tokens and emits on change (including a forced logout when a
// refresh fails), this context stays in sync with what's actually being sent.

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true only during the initial "do we have a session?" check
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: seed tokens from secure storage. If we have one, confirm it against
  // /auth/me (which will transparently refresh if the access token has expired).
  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await initTokens();
      if (!active) return;
      if (stored) {
        try {
          const me = await api.get<User>('/auth/me');
          if (active) {
            setInventoryCacheScope(me.id);
            setUser(me);
            setHasToken(true);
          }
        } catch {
          // Token invalid and unrefreshable — clear it and start at login.
          await clearSession();
          if (active) setHasToken(false);
        }
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // If ApiClient forces a logout (refresh failed mid-session), reflect it here so
  // the navigator drops back to the login screen.
  useEffect(() => {
    return onTokenChange((tokens) => {
      if (!tokens) {
        setInventoryCacheScope(null);
        setHasToken(false);
        setUser(null);
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    await setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setInventoryCacheScope(result.user.id);
    setUser(result.user);
    setHasToken(true);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await authApi.register(email, password);
    await setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setInventoryCacheScope(result.user.id);
    setUser(result.user);
    setHasToken(true);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setInventoryCacheScope(null);
    setUser(null);
    setHasToken(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: hasToken, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
