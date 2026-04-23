"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogOut, Home, Mail } from "lucide-react";
import { getStoredToken } from "@/lib/auth";

export default function RejectedAccount() {
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

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-red-50 to-pink-50 flex flex-col items-center justify-center p-4">
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
                        <div className="p-4 bg-red-100 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                        Account Rejected
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="font-semibold text-red-900 mb-2">Why was my account rejected?</h3>
                        <p className="text-red-800 text-sm leading-relaxed">
                            Unfortunately, your account application did not meet our community standards. This decision was made during the admin review process.
                        </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Possible reasons include:</h3>
                        <ul className="text-gray-700 text-sm space-y-2">
                            <li>• Invalid or suspicious account information</li>
                            <li>• Violation of our terms of service</li>
                            <li>• Incomplete or inaccurate profile details</li>
                            <li>• Security concerns</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">What can you do?</h3>
                        <p className="text-blue-800 text-sm mb-3">
                            If you believe this decision was made in error, you can contact our support team for more information about the rejection reason.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            <Mail className="w-4 h-4" />
                            Contact Support
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

                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-500 text-center mb-4">
                            You can create a new account, but please ensure all information is accurate and complies with our community guidelines.
                        </p>
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
