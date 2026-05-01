"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import authService, { type CurrentUserResponse } from "@/services/authService";
import {
  getAuthClaims,
  isProtectedPath,
  subscribeToAuthChanges,
} from "@/lib/auth";

interface UserContextType {
  user: CurrentUserResponse | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  verificationStatus: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToAuthIfNeeded = useCallback(() => {
    if (!pathname || !isProtectedPath(pathname)) return;
    router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
  }, [pathname, router]);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== "ERR_CANCELED") {
        console.error("[UserContext] Failed to refresh user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user data",
        );
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      const claims = getAuthClaims();
      if (claims) {
        await refreshUser();
        return;
      }

      setUser(null);
      setError(null);
      setLoading(false);
      redirectToAuthIfNeeded();
    };

    void initializeUser();

    const unsubscribe = subscribeToAuthChanges((detail) => {
      const claims = getAuthClaims();

      if (claims) {
        void refreshUser();
        return;
      }

      setUser(null);
      setError(null);
      setLoading(false);

      if (detail.reason === "logout" || detail.reason === "expired") {
        redirectToAuthIfNeeded();
      }
    });

    return unsubscribe;
  }, [redirectToAuthIfNeeded, refreshUser]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      void refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshUser, user]);

  const value: UserContextType = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      isAuthenticated: user !== null,
      verificationStatus: user?.verification_status || "PENDING",
    }),
    [error, loading, refreshUser, user],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};