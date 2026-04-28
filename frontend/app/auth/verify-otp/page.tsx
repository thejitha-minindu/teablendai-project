"use client"; // Tells Next.js to run this component in the browser, not on the server

// --- Imports ---
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, KeyRound, Mail } from "lucide-react"; // Icons
import { apiClient } from "@/lib/apiClient"; // Tool used to send requests to our backend

function VerifyOTPContent() {
  // --- Next.js Hooks ---
  const router = useRouter(); // Used to redirect the user to other pages
  const searchParams = useSearchParams(); // Used to read URL parameters (e.g., ?email=john@example.com)

  // --- Reading Data from the URL ---
  // When the user comes from the "Forgot Password" page, their email is in the URL
  const email = searchParams.get("email") || "";
  const role = searchParams.get("role"); // 'buyer' or 'seller'
  
  // Helpers to keep the role in the URL when redirecting
  const sharedRoleSuffix =
    role === "buyer" || role === "seller" ? `?role=${role}` : "";
  const queryRoleSuffix =
    role === "buyer" || role === "seller" ? `&role=${role}` : "";

  // Determine back button href
  const backHref = role === "buyer" || role === "seller" 
    ? `/auth/forgot-password?role=${role}` 
    : "/auth/forgot-password";

  // --- React State ---
  // These variables hold data that changes while the user interacts with the page
  const [otp, setOtp] = useState(""); // The 6-digit code the user types in
  const [loading, setLoading] = useState(false); // True while waiting for the backend to reply
  const [message, setMessage] = useState(""); // Success or error messages shown to the user
  const [success, setSuccess] = useState(false); // Did the OTP verification succeed?

  // --- Security Check (Effect) ---
  // If someone tries to open this page directly without an email in the URL,
  // we kick them back to the Forgot Password page.
  useEffect(() => {
    if (!email) {
      router.push(`/auth/forgot-password${sharedRoleSuffix}`);
    }
  }, [email, router, sharedRoleSuffix]);

  // --- Form Submission (OTP Verification Flow) ---
  // Called when the user clicks "Verify Code"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from reloading
    setMessage(""); // Clear old messages
    setLoading(true); // Show the loading spinner

    try {
      // 1. API Call: Send the email and the OTP code to the backend
      const response = await apiClient.post("/auth/verify-otp", {
        email,
        otp_code: otp,
      });

      // 2. Success! The backend matched the OTP.
      setSuccess(true);
      setMessage("OTP verified! Redirecting...");

      // 3. Routing: Wait 2 seconds, then send them to the "Reset Password" page.
      // We pass along a special `password_reset_id` that the backend gave us.
      // This proves they verified the OTP when they try to save their new password.
      setTimeout(() => {
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(email)}&reset_id=${response.data.password_reset_id}&otp_code=${encodeURIComponent(otp)}${queryRoleSuffix}`
        );
      }, 2000);
    } catch (err: any) {
      // 4. Error handling: OTP was wrong or expired
      setMessage(err.response?.data?.detail || "Invalid OTP. Try again.");
    } finally {
      setLoading(false); // Stop the loading spinner
    }
  };

  // --- Resend OTP Flow ---
  // Called when the user clicks "Resend OTP"
  const handleResendOTP = async () => {
    setMessage("");
    setLoading(true);

    try {
      // Ask the backend to generate a new OTP and email it again
      await apiClient.post("/auth/forgot-password", { email });
      setMessage("New OTP sent successfully!");
      setSuccess(true);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to resend OTP");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // If there's no email, render nothing while the useEffect redirects them
  if (!email) return null;

  // --- UI Render ---
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-green-50">
      {/* Header - Compact */}
      <header className="absolute top-0 left-0 right-0 z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <img src="/Tealogo.png" className="h-15 w-35" alt="Tea Blend AI Logo" />
        </Link>

        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-green-700 transition backdrop-blur-sm hover:bg-green-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
      </header>

      {/* Main Content - Full height with flex centering */}
      <main className="flex h-full items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="overflow-hidden rounded-2xl border border-green-100 bg-white/95 shadow-2xl shadow-green-100/60 backdrop-blur-sm">
            {/* Form Content */}
            <div className="flex max-h-[90vh] flex-col overflow-y-auto p-6 sm:p-8">
              <div className="mb-5 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Verify OTP
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Enter the 6-digit code sent to
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-800 break-all">
                  {email}
                </p>
              </div>

              {/* MESSAGE BOX */}
              {/* Shows success (green) or error (red) alerts */}
              {message && (
                <div
                  className={`mb-4 rounded-lg border p-2.5 text-center text-xs font-medium flex items-center justify-center gap-1.5 ${
                    success
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {success ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {message}
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="otp" className="text-xs font-semibold text-gray-700">
                    One-Time Password
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      // The replace regex ensures only numbers (\D) can be typed
                      // slice(0, 6) limits it to exactly 6 characters
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className="h-10 rounded-lg border text-center text-base tracking-widest focus:border-green-500 focus:ring-green-500/20"
                    maxLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6} // Cannot submit until 6 digits are typed
                  className="h-10 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all duration-300 hover:from-green-700 hover:to-emerald-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Verifying...</span>
                    </span>
                  ) : (
                    <span className="text-sm">Verify Code</span>
                  )}
                </Button>
              </form>

              {/* RESEND LINK */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  Didn't receive code?{" "}
                  <button
                    onClick={handleResendOTP}
                    className="font-semibold text-green-700 transition-colors hover:text-green-800 hover:underline"
                    disabled={loading} // Don't let them spam the resend button
                  >
                    Resend OTP
                  </button>
                </p>
              </div>

              {/* SECURITY NOTE */}
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-center">
                <p className="text-xs text-blue-700">
                  OTP is valid for 5 minutes (max 3 attempts)
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { Suspense as ReactSuspense } from "react";

export default function VerifyOTPPage() {
  return (
    <ReactSuspense fallback={<div>Loading...</div>}>
      <VerifyOTPContent />
    </ReactSuspense>
  );
}