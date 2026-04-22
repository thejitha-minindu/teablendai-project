"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordResetId, setPasswordResetId] = useState("");

  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/verify-otp", {
        email,
        otp_code: otp
      });

      setSuccess(true);
      setPasswordResetId(response.data.password_reset_id);

      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&reset_id=${response.data.password_reset_id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setError(""); // Clear any previous errors
      // Show success message briefly
      const successMsg = "New OTP sent to your email!";
      setError(successMsg);
      setTimeout(() => setError(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && !error.includes("New OTP sent") && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {error && error.includes("New OTP sent") && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                OTP verified! Redirecting to password reset...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 mb-2 block">
                6-Digit Code
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => {
                  // Only allow digits and limit to 6 characters
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                }}
                placeholder="123456"
                required
                disabled={loading || success}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || success || otp.length !== 6}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : success ? (
                "Verified!"
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2 text-sm">
            <p className="text-gray-600">
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="text-blue-600 hover:underline font-semibold disabled:opacity-50"
              >
                Resend OTP
              </button>
            </p>

            <div className="pt-2">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Forgot Password
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Security Note:</strong> The OTP is valid for 5 minutes and allows up to 3 verification attempts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}