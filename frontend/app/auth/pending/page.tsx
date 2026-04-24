"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Home } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { getStoredToken } from "@/lib/auth";

export default function PendingApproval() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if user is authenticated
        const token = getStoredToken();
        if (!token) {
            router.push("/auth/login");
        }
    }, [router]);

    const handleLogout = () => {
        setIsLoading(true);
        localStorage.removeItem("teablend_token");
        router.push("/auth/login");
    };

    const checkApprovalStatus = async () => {
        try {
            const token = getStoredToken();
            if (!token) return;

            // Fetch a fresh token from the backend
            const response = await apiClient.post("/auth/refresh");

            if (response.data?.access_token) {
                // Save new token
                localStorage.setItem("teablend_token", response.data.access_token);
                // Dispatch event for other hooks
                window.dispatchEvent(new Event("teablend-auth-changed"));
                
                // Decode to check status
                const payloadBase64 = response.data.access_token.split('.')[1];
                if (payloadBase64) {
                    const payload = JSON.parse(atob(payloadBase64));
                    if (payload.status === "APPROVED") {
                        // Redirect based on role
                        const role = payload.role;
                        router.push(role === "seller" ? "/seller/dashboard" : "/buyer/dashboard");
                    } else if (payload.status === "REJECTED") {
                        router.push("/auth/rejected");
                    }
                }
            }
        } catch (error) {
            console.error("Error checking approval status:", error);
        }
    };

    useEffect(() => {
        // Run check periodically
        const intervalId = setInterval(checkApprovalStatus, 5000);
        return () => clearInterval(intervalId);
    }, [router]);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-yellow-50 to-orange-50 flex flex-col items-center justify-center p-4">
            {/* Navigation */}
            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative h-12 w-32">
                        <Image src="/tea-blend-logo.svg" alt="Tea Blend AI Logo" fill className="object-contain" />
                    </div>
                </Link>
            </div>

            {/* Main Content */}
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-yellow-100 rounded-full">
                            <Clock className="w-12 h-12 text-yellow-600 animate-spin" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                        Account Pending Review
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2">What's happening?</h3>
                        <p className="text-yellow-800 text-sm leading-relaxed">
                            Your account has been successfully created! Our admin team is currently reviewing your profile. This typically takes 24-48 hours.
                        </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                                    <span className="text-green-700 font-bold text-sm">✓</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700">Account created successfully</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100">
                                    <span className="text-yellow-700 font-bold text-sm">⏳</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700">Awaiting admin approval</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                        <ul className="text-blue-800 text-sm space-y-2">
                            <li>• Our team will verify your information</li>
                            <li>• We'll check your account details</li>
                            <li>• Once approved, you'll gain full access</li>
                        </ul>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-500 text-center mb-4">
                            You can check back anytime to see if your account has been approved. If you have any questions, please contact our support team.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={checkApprovalStatus}
                            variant="outline"
                            className="flex-1"
                        >
                            Check Status
                        </Button>
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="flex-1 gap-2"
                            disabled={isLoading}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </div>

                    <Link href="/" className="block">
                        <Button variant="ghost" className="w-full gap-2">
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
