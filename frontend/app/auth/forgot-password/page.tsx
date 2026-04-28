"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react"; // Icons
import { apiClient } from "@/lib/apiClient"; // Tool for sending requests to the backend

export default function ForgotPasswordPage() {
  // --- Next.js Hooks ---
  const router = useRouter(); // Used to redirect to another page
  const searchParams = useSearchParams(); // Used to read URL parameters (like ?role=buyer)
  
  // Get the role from the URL so we can preserve it if they go back to login/signup
  const role = searchParams.get("role");

  // --- React State ---
  // useState stores data that changes while the user interacts with the page
  const [email, setEmail] = useState(""); // The email the user types in
  const [loading, setLoading] = useState(false); // Shows a spinner while waiting for the server
  const [error, setError] = useState(""); // Holds error messages if something goes wrong
  const [submitted, setSubmitted] = useState(false); // True when the OTP is successfully sent

  // --- Form Submission Logic ---
  // Called when the user clicks "Send Reset Code"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the browser from reloading the page
    setError(""); // Clear previous errors
    setLoading(true); // Show loading spinner

    console.log("Forgot password form submitted with email:", email);

    try {
      // 1. Send the email to the backend to generate and send an OTP
      console.log("Sending forgot-password request to backend with email:", email);
      const response = await apiClient.post("/auth/forgot-password", { email });
      console.log("Forgot-password response:", response.data);
      
      // 2. If successful, update the UI to show a success message
      setSubmitted(true);

      // 3. Wait 2 seconds, then redirect to the OTP verification page
      setTimeout(() => {
        const roleSuffix = role === "buyer" || role === "seller" ? `&role=${role}` : "";
        // We pass the email in the URL so the next page knows who is verifying
        router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}${roleSuffix}`);
      }, 2000);
    } catch (err: any) {
      // 4. Handle errors (e.g., user not found)
      console.error("Forgot-password error:", err);
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      // Hide the loading spinner whether it succeeded or failed
      setLoading(false); 
    }
  };

  // --- Routing Helpers ---
  // Determine where the "Login" and "Sign up" links should point based on the role
  const loginHref =
    role === "buyer" || role === "seller" ? `/auth/${role}/login` : "/auth/login";
  const signupHref =
    role === "buyer" || role === "seller" ? `/auth/${role}/register` : "/auth/signup";
  
  // Determine back button href
  const backHref = role === "buyer" || role === "seller" ? `/auth/${role}/login` : "/auth/login";

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
          Back to Login
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
                  Forgot Password
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Enter your email to receive a secure reset code
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  We'll send you a one-time password to reset your account
                </p>
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-700 flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </div>
              )}

              {/* Success Message Display */}
              {submitted && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-2.5 text-center text-xs font-medium text-green-700 flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  OTP sent successfully! Redirecting...
                </div>
              )}

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} // Update state as user types
                      placeholder="you@example.com"
                      required
                      disabled={loading} // Prevent typing while submitting
                      className="h-10 rounded-lg border pl-9 text-sm focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email} // Disable if loading or email is empty
                  className="h-10 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all duration-300 hover:from-green-700 hover:to-emerald-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Sending...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-sm">Send Reset Code</span>
                    </span>
                  )}
                </Button>
              </form>

              {/* Helper Links */}
              <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-center">
                  <p className="text-xs text-gray-600">
                    Remember your password?{" "}
                    <Link 
                      href={loginHref} 
                      className="inline-flex items-center gap-1 font-semibold text-green-700 transition-colors hover:text-green-800 hover:underline"
                    >
                      Back to Login
                    </Link>
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Don't have an account?{" "}
                    <Link 
                      href={signupHref} 
                      className="font-semibold text-green-700 transition-colors hover:text-green-800 hover:underline"
                    >
                      Sign up for free
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}