import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthClaims } from '@/lib/auth';

/**
 * Hook to protect routes based on user approval status
 * Should be called in layout or page components for protected routes
 */
export function useAuthStatusProtection() {
  const router = useRouter();

  useEffect(() => {
    const claims = getAuthClaims();

    if (!claims) {
      // No token, redirect to login
      router.push('/auth/login');
      return;
    }

    const status = claims.status;

    // Redirect based on status
    if (status === 'PENDING') {
      router.push('/auth/pending');
    } else if (status === 'REJECTED') {
      router.push('/auth/rejected');
    } else if (status !== 'APPROVED') {
      // Unknown status, redirect to pending
      router.push('/auth/pending');
    }
  }, [router]);
}

/**
 * Hook to check if user is approved
 * Returns true if user is approved, false otherwise
 */
export function useIsApproved(): boolean {
  const claims = getAuthClaims();
  return claims?.status === 'APPROVED';
}

/**
 * Hook to get user status
 * Returns the user's approval status or null if not authenticated
 */
export function useUserStatus() {
  const claims = getAuthClaims();
  return claims?.status || null;
}
