import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '@/services/api';
import { getStoredJson, removeStoredValue, setStoredJson } from '@/services/storage';
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/domain';

type AuthContextValue = {
  session: AuthSession | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const SESSION_KEY = 'wildlife.authSession.v1';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedSession = await getStoredJson<AuthSession | null>(SESSION_KEY, null);

      if (mounted) {
        setSession(storedSession);
        setInitializing(false);
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const saveSession = async (nextSession: AuthSession) => {
    setSession(nextSession);
    await setStoredJson(SESSION_KEY, nextSession);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      loading,
      error,
      login: async (payload) => {
        setLoading(true);
        setError(null);

        try {
          const nextSession = await authApi.login(payload);
          await saveSession(nextSession);
        } catch (exception) {
          const message =
            exception instanceof Error ? exception.message : 'Unable to sign in right now.';
          setError(message);
          throw exception;
        } finally {
          setLoading(false);
        }
      },
      register: async (payload) => {
        setLoading(true);
        setError(null);

        try {
          const nextSession = await authApi.register(payload);
          await saveSession(nextSession);
        } catch (exception) {
          const message =
            exception instanceof Error ? exception.message : 'Unable to create account right now.';
          setError(message);
          throw exception;
        } finally {
          setLoading(false);
        }
      },
      forgotPassword: async (email) => {
        setLoading(true);
        setError(null);

        try {
          const response = await authApi.forgotPassword(email);
          return response.message;
        } catch (exception) {
          const message =
            exception instanceof Error
              ? exception.message
              : 'Unable to request password reset right now.';
          setError(message);
          throw exception;
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        setSession(null);
        await removeStoredValue(SESSION_KEY);
      },
      clearError: () => setError(null),
    }),
    [error, initializing, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
