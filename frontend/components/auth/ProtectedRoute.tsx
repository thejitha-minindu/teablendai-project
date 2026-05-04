"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
    AUTH_CHANGED_EVENT,
    clearStoredAuthToken,
    getAuthClaims,
    getHomePathByRole,
    type UserRole,
} from "@/lib/auth";

type ProtectedRouteProps = {
    children: React.ReactNode;
    requiredRole?: UserRole;
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const validate = () => {
            if (typeof window === "undefined") return;

            setIsAuthorized(false);
            const claims = getAuthClaims();
            if (!claims) {
                clearStoredAuthToken();
                if (requiredRole === "admin") {
                    window.location.href = `/auth/admin/login?redirect=${encodeURIComponent(pathname)}`;
                } else {
                    window.location.href = `/auth?redirect=${encodeURIComponent(pathname)}`;
                }
                return;
            }

            if (claims.status === "REJECTED") {
                window.location.href = "/auth/rejected";
                return;
            }

            if (claims.status && claims.status !== "APPROVED") {
                window.location.href = "/auth/pending";
                return;
            }

            if (requiredRole && claims.role !== requiredRole) {
                if (requiredRole === "admin") {
                    window.location.href = `/auth/admin/login?redirect=${encodeURIComponent(pathname)}`;
                    return;
                }
                window.location.href = getHomePathByRole(claims.role);
                return;
            }

            setIsAuthorized(true);
        };

        validate();
        window.addEventListener(AUTH_CHANGED_EVENT, validate);
        window.addEventListener("focus", validate);

        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, validate);
            window.removeEventListener("focus", validate);
        };
    }, [pathname, requiredRole]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-[#3A5A40] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
