"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearStoredAuthToken,
  getAuthClaims,
  getHomePathByRole,
  getStoredToken,
  subscribeToAuthChanges,
  type AuthChangeReason,
  type UserRole,
} from "@/lib/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
};

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const resolveLoginPath = () => {
      if (requiredRole === "admin" || pathname.startsWith("/admin")) {
        return "/auth/admin/login";
      }
      return "/auth";
    };

    const resolveRedirectTarget = () => {
      if (requiredRole === "admin" && (pathname === "/admin" || pathname === "/admin/")) {
        return "/admin/dashboard";
      }

      return pathname;
    };

    const redirectToAuthHub = () => {
      router.replace("/auth");
    };

    const redirectToLogin = () => {
      const loginPath = resolveLoginPath();
      const redirectSuffix = `?redirect=${encodeURIComponent(resolveRedirectTarget())}`;
      router.replace(`${loginPath}${redirectSuffix}`);
    };

    const validate = (reason?: AuthChangeReason) => {
      if (typeof window === "undefined") return;

      setIsAuthorized(false);
      const token = getStoredToken();
      const claims = token ? getAuthClaims() : null;
      if (!claims) {
        if (reason === "logout") {
          redirectToAuthHub();
          return;
        }

        if (!token) {
          redirectToLogin();
          return;
        }

        clearStoredAuthToken("expired");
        redirectToLogin();
        return;
      }

      if (claims.status === "REJECTED") {
        router.replace("/auth/rejected");
        return;
      }

      if (claims.status && claims.status !== "APPROVED") {
        router.replace("/auth/pending");
        return;
      }

      if (requiredRole && claims.role !== requiredRole) {
        if (requiredRole === "admin") {
          clearStoredAuthToken("expired");
          redirectToLogin();
          return;
        }

        router.replace(getHomePathByRole(claims.role));
        return;
      }

      setIsAuthorized(true);
    };

    validate();

    const unsubscribe = subscribeToAuthChanges((detail) => {
      validate(detail.reason);
    });

    const handleFocus = () => validate();
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname, requiredRole, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#3A5A40] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
