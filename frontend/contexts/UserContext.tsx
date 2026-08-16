"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  // Use a ref for redirect so the fetch effect doesn't depend on pathname
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);
  pathnameRef.current = pathname;
  routerRef.current = router;

  const redirectToAuthIfNeeded = useCallback(() => {
    const currentPath = pathnameRef.current;
    if (!currentPath || !isProtectedPath(currentPath)) return;
    setTimeout(() => {
      routerRef.current.replace(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    }, 0);
  }, []); // Stable — uses refs, no deps on pathname/router

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const claims = getAuthClaims();
      let currentUser: CurrentUserResponse | null = null;
      
      if (claims?.role === 'admin') {
        currentUser = await authService.getCurrentAdmin();
      } else {
        currentUser = await authService.getCurrentUser();
      }
      
      console.log('[UserContext] Refreshed user data:', currentUser);
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

  // Initialize user on mount — runs ONCE, not on every pathname change
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

  // Periodic refresh every 30s (only when user is authenticated)
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