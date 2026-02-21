'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import type { User } from './schemas';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialAccessToken?: string | null;
}

export function AuthProvider({
  children,
  initialUser = null,
  initialAccessToken = null,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: initialUser,
    accessToken: initialAccessToken,
    isLoading: false,
  });

  const setAuth = useCallback((user: User, accessToken: string) => {
    setState({ user, accessToken, isLoading: false });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuth, clearAuth }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
