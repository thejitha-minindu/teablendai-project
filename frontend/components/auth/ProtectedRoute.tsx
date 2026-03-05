"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // 1. Check if we are running in the browser
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("teablend_token");

            // 2. If there is no token, kick them to the login page
            if (!token) {
                console.warn("Unauthorized access attempt. Redirecting to login.");
                // We use window.location.href for a hard redirect to clear state
                window.location.href = `/auth/login?redirect=${pathname}`; 
            } else {
                // 3. If they have a token, allow them to see the page
                setIsAuthorized(true);
            }
        }
    }, [pathname]);

    // Show nothing (or a loading spinner) while checking the token
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-[#3A5A40] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Render the actual page if authorized
    return <>{children}</>;
}