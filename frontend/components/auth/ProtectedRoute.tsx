"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clearStoredAuthToken, getAuthClaims, getHomePathByRole, type UserRole } from "@/lib/auth";

type ProtectedRouteProps = {
    children: React.ReactNode;
    requiredRole?: UserRole;
};

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const claims = getAuthClaims();
            if (!claims) {
                clearStoredAuthToken();
                window.location.href = `/auth/login?redirect=${pathname}`; 
                return;
            }

            if (requiredRole && claims.role !== requiredRole) {
                window.location.href = getHomePathByRole(claims.role);
                return;
            }

            setIsAuthorized(true);
        }
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