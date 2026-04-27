"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import useSWR from "swr";

type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  authoritySubRole?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
};

type AuthMeResponse = {
  success: boolean;
  data?: {
    user?: AuthUser;
  };
  error?: {
    message?: string;
  };
};

type AuthSessionContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  setCachedUser: (next: AuthUser | null) => void;
};

const AUTH_ME_KEY = "/api/auth/me";

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

async function fetchAuthSession(): Promise<AuthMeResponse> {
  const response = await fetch(AUTH_ME_KEY, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as AuthMeResponse | null;
  if (payload) {
    return payload;
  }

  return {
    success: false,
    error: { message: "Unable to load session." },
  };
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<AuthMeResponse>(AUTH_ME_KEY, fetchAuthSession, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  const user = data?.success ? data.data?.user ?? null : null;

  const refreshSession = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const setCachedUser = useCallback(
    (next: AuthUser | null) => {
      void mutate(
        (current) => {
          if (!next) {
            return {
              success: false,
              data: {},
              error: current?.error,
            };
          }

          return {
            success: true,
            data: {
              ...(current?.data ?? {}),
              user: next,
            },
            error: current?.error,
          };
        },
        false
      );
    },
    [mutate]
  );

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error: error instanceof Error ? error.message : null,
      refreshSession,
      setCachedUser,
    }),
    [user, isLoading, error, refreshSession, setCachedUser]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return ctx;
}
