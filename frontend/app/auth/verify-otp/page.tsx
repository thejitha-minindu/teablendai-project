"use client"; // Tells Next.js to run this component in the browser, not on the server

// --- Imports ---
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react"; // Icons
import { apiClient } from "@/lib/apiClient"; // Tool used to send requests to our backend

export default function VerifyOTPPage() {
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
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // If there's no email, render nothing while the useEffect redirects them
  if (!email) return null;

  // --- UI Render ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 px-4 py-6">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0 backdrop-blur-lg bg-white/95">
        
        {/* HEADER */}
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 shadow-xl">
              <Image
                src="/tea-blend-logo.svg"
                alt="Logo"
                width={80}
                height={80}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Verify OTP
          </CardTitle>

          <CardDescription className="text-gray-600 text-sm">
            Enter the 6-digit code sent to <br />
            <span className="font-semibold text-gray-800">{email}</span>
          </CardDescription>
        </CardHeader>

        {/* BODY */}
        <CardContent className="space-y-4">

          {/* MESSAGE BOX */}
          {/* Shows success (green) or error (red) alerts */}
          {message && (
            <div
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <p className={`text-sm ${success ? "text-green-700" : "text-red-600"}`}>
                {message}
              </p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={otp}
              onChange={(e) =>
                // The replace regex ensures only numbers (\D) can be typed
                // slice(0, 6) limits it to exactly 6 characters
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              className="h-12 text-center text-lg tracking-widest rounded-full border-2 focus:border-green-500"
              maxLength={6}
              required
            />

            <Button
              type="submit"
              disabled={loading || otp.length !== 6} // Cannot submit until 6 digits are typed
              className="w-full h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>

          {/* RESEND LINK */}
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Didn’t receive code?{" "}
              <button
                onClick={handleResendOTP}
                className="text-green-600 font-semibold hover:underline"
                disabled={loading} // Don't let them spam the resend button
              >
                Resend OTP
              </button>
            </p>
          </div>

          {/* BACK LINK */}
          <div className="text-center pt-2">
              <Link
              href={`/auth/forgot-password${sharedRoleSuffix}`}
              className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </div>

          {/* SECURITY NOTE */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            OTP is valid for 5 minutes (max 3 attempts)
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
