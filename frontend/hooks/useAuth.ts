import { useState, useCallback } from 'react';
import authService from '@/services/authService';

interface UseAuthReturn {
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (data: RegisterData) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<string | null>;
  resetPassword: (email: string, otp: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  userName: string;
  firstName: string;
  lastName: string;
  phoneNum: string;
  defaultRole?: 'buyer' | 'seller';
}

export const useAuth = (): UseAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(
        data.email,
        data.password,
        data.userName,
        data.firstName,
        data.lastName,
        data.phoneNum,
        data.defaultRole || 'buyer'
      );
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Registration failed';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Login failed';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authService.requestPasswordReset(email);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to send OTP';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyOTP(email, otp);
      return response.password_reset_id;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'OTP verification failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(
    async (email: string, otp: string, newPassword: string, confirmPassword: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await authService.resetPassword(email, otp, newPassword, confirmPassword);
        return true;
      } catch (err: any) {
        const message = err.response?.data?.detail || err.message || 'Password reset failed';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setError(null);
  }, []);

  return {
    loading,
    error,
    isAuthenticated: authService.isAuthenticated(),
    register,
    login,
    requestPasswordReset,
    verifyOTP,
    resetPassword,
    logout,
  };
};
