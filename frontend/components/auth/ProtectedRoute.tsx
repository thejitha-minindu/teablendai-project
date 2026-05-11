"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearStoredAuthToken,
  getAuthClaims,
  getHomePathByRole,
  getStoredToken,
  subscribeToAuthChanges,
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
    const validate = () => {
      if (typeof window === "undefined") return;

            setIsAuthorized(false);
            const claims = getAuthClaims();
            if (!claims) {
                clearStoredAuthToken();
                window.location.href = `/auth?redirect=${encodeURIComponent(pathname)}`;
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
                window.location.href = getHomePathByRole(claims.role);
                return;
            }

      setIsAuthorized(true);
    };

    validate();

    const unsubscribe = subscribeToAuthChanges(() => {
      validate();
    });

    window.addEventListener("focus", validate);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", validate);
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
