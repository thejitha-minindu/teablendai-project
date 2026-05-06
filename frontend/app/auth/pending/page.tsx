"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, LogOut } from "lucide-react"; // Icons
import { apiClient } from "@/lib/apiClient"; // Tool for backend requests
import {
  clearStoredAuthToken,
  getAuthClaimsFromToken,
  getStoredToken,
  setStoredAuthToken,
} from "@/lib/auth"; // Utility to manage the user's JWT token

function PendingApprovalContent() {
  // --- Next.js Hooks ---
  const router = useRouter(); // For page navigation
  const searchParams = useSearchParams(); // To read the URL (e.g., ?context=seller-upgrade)
  
  // --- React State ---
  const [isLoading, setIsLoading] = useState(false); // Controls loading states on buttons

  // Determine if the user is here because they registered as a new user
  // OR if they are a buyer trying to upgrade to a seller.
  const isSellerUpgradeFlow = searchParams.get("context") === "seller-upgrade";

  // --- Dynamic UI Text ---
  // useMemo remembers this text so it doesn't have to be recalculated on every render
  const copy = useMemo(
    () => ({
      title: isSellerUpgradeFlow ? "Seller Approval Pending" : "Account Pending Review",
      intro: isSellerUpgradeFlow
        ? "Your seller request has been submitted successfully. Our admin team is reviewing your seller details now."
        : "Your account has been successfully created! Our admin team is currently reviewing your profile. This typically takes 24-48 hours.",
      completeLabel: isSellerUpgradeFlow
        ? "Seller request submitted successfully"
        : "Account created successfully",
      pendingLabel: isSellerUpgradeFlow
        ? "Awaiting seller approval"
        : "Awaiting admin approval",
      note: isSellerUpgradeFlow
        ? "You can continue using your buyer account while this request is under review. Seller access will appear once the request is approved."
        : "You can check back anytime to see if your account has been approved. If you have any questions, please contact our support team.",
    }),
    [isSellerUpgradeFlow]
  );

  // --- Security Check ---
  // If the user lands here but has no token (not logged in), send them back to login
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  // --- Logout Logic ---
  const handleLogout = () => {
    setIsLoading(true);
    clearStoredAuthToken(); // Clear the token and notify the rest of the app
    router.push("/auth"); // Send back to login page
  };

  // --- Polling (Checking Status Automatically) ---
  // This function pings the backend to see if an Admin has approved the account yet
  const checkApprovalStatus = async () => {
    try {
      const token = getStoredToken();
      if (!token) return;

      // 1. Ask the backend for a fresh token (which contains the latest status)
      const refreshResponse = await apiClient.post("/auth/refresh");

      if (!refreshResponse.data?.access_token) {
        return;
      }

      // 2. Save the fresh token and notify the rest of the app
      setStoredAuthToken(refreshResponse.data.access_token);

      // 3. Decode the token to read the status directly from it
      const claims = getAuthClaimsFromToken(refreshResponse.data.access_token);
      if (!claims) return;

      // 4. Also fetch the full profile to check specific seller status
      const profileResponse = await apiClient.get("/profile");
      const profile = profileResponse.data;
      const sellerStatus = (profile?.seller_verification_status || "").toUpperCase();

      // --- Routing Logic based on Status ---

      // If they were completely rejected, send to rejected page
      if (claims.status === "REJECTED" || sellerStatus === "REJECTED") {
        router.push(sellerStatus === "REJECTED" ? "/auth/rejected?context=seller-upgrade" : "/auth/rejected");
        return;
      }

      // If they are approved as a seller
      if (sellerStatus === "APPROVED") {
        router.push("/seller/dashboard");
        return;
      }

      // If they are approved as a buyer (and not waiting for seller approval)
      if (claims.status === "APPROVED" && sellerStatus !== "PENDING") {
        router.push(claims.role === "seller" ? "/seller/dashboard" : "/buyer/dashboard");
        return;
      }
    } catch (error) {
      console.error("Error checking approval status:", error);
    }
  };

  // --- Interval Setup ---
  // Run the check immediately, then poll every 5 seconds
  useEffect(() => {
    checkApprovalStatus();
    const intervalId = setInterval(checkApprovalStatus, 5000);
    return () => clearInterval(intervalId); // Cleanup the timer when the user leaves the page
  }, [isSellerUpgradeFlow]);

  // --- UI Render ---
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-yellow-50 to-orange-50 flex flex-col items-center justify-center p-4">
      {/* Header Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-12 w-32">
            <Image src="/tea-blend-logo.svg" alt="Tea Blend AI Logo" fill className="object-contain" />
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {copy.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Intro Text */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h3 className="font-semibold text-yellow-900 mb-1 text-sm">What&apos;s happening?</h3>
            <p className="text-yellow-800 text-xs leading-relaxed">{copy.intro}</p>
          </div>

          {/* Status Timeline UI */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex gap-2 items-center">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                OK
              </div>
              <p className="text-xs text-gray-700">{copy.completeLabel}</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold">
                ...
              </div>
              <p className="text-xs text-gray-700">{copy.pendingLabel}</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="font-semibold text-blue-900 mb-1 text-sm">What happens next?</h3>
            <ul className="text-blue-800 text-xs space-y-1">
              <li>- Our team will verify your information</li>
              <li>- We&apos;ll review the submitted details</li>
              <li>- Once approved, the right dashboard access will unlock automatically</li>
            </ul>
          </div>

          {/* Bottom Note */}
          <div className="border-t pt-3">
            <p className="text-[11px] text-gray-500 text-center mb-3">
              {copy.note}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
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

import { Suspense as ReactSuspense } from "react";

export default function PendingApproval() {
  return (
    <ReactSuspense fallback={<div>Loading...</div>}>
      <PendingApprovalContent />
    </ReactSuspense>
  );
}
