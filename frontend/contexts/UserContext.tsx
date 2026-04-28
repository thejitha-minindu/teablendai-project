"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { CurrentUserResponse } from '@/services/authService';
import { getAuthClaims, AUTH_CHANGED_EVENT } from '@/lib/auth';

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
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = await authService.getCurrentUser();
      console.log('[UserContext] Refreshed user data:', currentUser);
      setUser(currentUser);
    } catch (err: any) {
      console.error('[UserContext] Failed to refresh user:', err);
      setError(err.message || 'Failed to fetch user data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auth change listener
  useEffect(() => {
    const initializeUser = async () => {
      const claims = getAuthClaims();
      if (claims) {
        await refreshUser();
      } else {
        setLoading(false);
      }
    };

    initializeUser();

    // Listen for auth changes (login/logout)
    const handleAuthChange = () => {
      const claims = getAuthClaims();
      if (claims) {
        refreshUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, []);

  // Periodic refresh for already logged-in users (every 30 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log('[UserContext] Periodic user refresh');
      refreshUser();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const isAuthenticated = user !== null;
  const verificationStatus = user?.verification_status || 'PENDING';

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    isAuthenticated,
    verificationStatus,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};