import { createContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';
import {
  clearStoredSession,
  createAvatar,
  getStoredSession,
  getStoredToken,
  persistSession,
} from '../utils/session';

export const AuthContext = createContext(null);

const defaultSession = {
  isAuthenticated: false,
  user: null,
  token: null,
  isInitializing: true,
};

function normalizeUser(user) {
  return {
    ...user,
    avatar: createAvatar(user.name),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(defaultSession);

  useEffect(() => {
    const initializeSession = async () => {
      const storedToken = getStoredToken();
      const storedSession = getStoredSession();

      if (!storedToken || !storedSession?.user) {
        setSession({ ...defaultSession, isInitializing: false });
        return;
      }

      try {
        const user = await authApi.me();
        const nextSession = {
          isAuthenticated: true,
          user: normalizeUser(user),
          token: storedToken,
          isInitializing: false,
        };
        persistSession(nextSession);
        setSession(nextSession);
      } catch (error) {
        if (!error.status) {
          setSession({
            isAuthenticated: true,
            user: normalizeUser(storedSession.user),
            token: storedToken,
            isInitializing: false,
          });
          return;
        }

        clearStoredSession();
        setSession({ ...defaultSession, isInitializing: false });
      }
    };

    initializeSession();
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      login: async ({ email, password, expectedRole }) => {
        const response = await authApi.login({ email, password });

        if (expectedRole && response.user.role !== expectedRole) {
          throw new Error(`This account is registered as a ${response.user.role}.`);
        }

        const nextSession = {
          isAuthenticated: true,
          user: normalizeUser(response.user),
          token: response.access_token,
          isInitializing: false,
        };

        persistSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      register: async (payload) => {
        const response = await authApi.register(payload);
        const nextSession = {
          isAuthenticated: true,
          user: normalizeUser(response.user),
          token: response.access_token,
          isInitializing: false,
        };

        persistSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      refreshUser: async () => {
        const user = await authApi.me();
        const nextSession = {
          ...session,
          user: normalizeUser(user),
        };
        persistSession(nextSession);
        setSession(nextSession);
        return nextSession.user;
      },
      logout: () => {
        clearStoredSession();
        setSession({ ...defaultSession, isInitializing: false });
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
