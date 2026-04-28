"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogOut, Home, Mail } from "lucide-react"; // Icons
import { getStoredToken } from "@/lib/auth"; // Utility to check if user is logged in

export default function RejectedAccount() {
    // --- Next.js Hooks ---
    const router = useRouter(); // Used to redirect to another page
    const searchParams = useSearchParams(); // Used to read URL parameters
    
    // --- React State ---
    const [isLoading, setIsLoading] = useState(false); // Controls the loading state of the sign-out button
    
    // Check if the user is here because their *seller request* was rejected, 
    // rather than their entire account.
    const isSellerUpgradeFlow = searchParams.get("context") === "seller-upgrade";

    // --- Dynamic Text Content ---
    // useMemo prevents this text from being recalculated every time the screen updates
    const copy = useMemo(() => ({
        // Titles and descriptions change depending on whether it's a seller rejection or a full account rejection
        title: isSellerUpgradeFlow ? "Seller Request Rejected" : "Account Rejected",
        reasonTitle: isSellerUpgradeFlow
            ? "Why was my seller request rejected?"
            : "Why was my account rejected?",
        reasonBody: isSellerUpgradeFlow
            ? "Your seller upgrade request was reviewed, but the submitted seller details were not approved by the admin team."
            : "Unfortunately, your account application did not meet our community standards. This decision was made during the admin review process.",
        helpBody: isSellerUpgradeFlow
            ? "You can continue using your buyer account and submit updated seller details again from your profile page."
            : "If you believe this decision was made in error, you can contact our support team for more information about the rejection reason.",
        note: isSellerUpgradeFlow
            ? "Your buyer account remains available. Review the seller details in your profile and resubmit when ready."
            : "You can create a new account, but please ensure all information is accurate and complies with our community guidelines.",
    }), [isSellerUpgradeFlow]);

    // --- Security Check ---
    // If a user tries to view this page but isn't logged in, redirect them to the login screen
    useEffect(() => {
        const token = getStoredToken();
        if (!token) {
            router.push("/auth");
        }
    }, [router]);

    // --- Logout Logic ---
    const handleLogout = () => {
        setIsLoading(true); // Show loading spinner
        localStorage.removeItem("teablend_token"); // Delete the saved token
        router.push("/auth"); // Send them back to the login page
    };

    // --- UI Render ---
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-red-50 to-pink-50 flex flex-col items-center justify-center p-4">
            
            {/* Header Logo */}
            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative h-12 w-32">
                        <Image src="/tea-blend-logo.svg" alt="Tea Blend AI Logo" fill className="object-contain" />
                    </div>
                </Link>
            </div>

            <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                
                {/* Header Section */}
                <CardHeader className="text-center space-y-2 pb-4">
                    <div className="flex justify-center">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        {copy.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    
                    {/* Reason Text */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h3 className="font-semibold text-red-900 mb-1 text-sm">{copy.reasonTitle}</h3>
                        <p className="text-red-800 text-xs leading-relaxed">
                            {copy.reasonBody}
                        </p>
                    </div>

                    {/* Possible Reasons List */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Possible reasons include:</h3>
                        <ul className="text-gray-700 text-xs space-y-1">
                            <li>- Invalid or suspicious account information</li>
                            <li>- Violation of our terms of service</li>
                            <li>- Incomplete or inaccurate profile details</li>
                            <li>- Security concerns</li>
                        </ul>
                    </div>

                    {/* Next Steps Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h3 className="font-semibold text-blue-900 mb-1 text-sm">What can you do?</h3>
                        <p className="text-blue-800 text-xs mb-2">{copy.helpBody}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2 h-9 text-sm"
                        >
                            <Mail className="w-4 h-4" />
                            Contact Support
                        </Button>
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="flex-1 gap-2 h-9 text-sm"
                            disabled={isLoading}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </div>

                    {/* Footer Note */}
                    <div className="border-t pt-3">
                        <p className="text-[11px] text-gray-500 text-center mb-3">
                            {copy.note}
                        </p>
                    </div>

                    <Link href="/" className="block">
                        <Button variant="ghost" className="w-full gap-2 h-9 text-sm">
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
