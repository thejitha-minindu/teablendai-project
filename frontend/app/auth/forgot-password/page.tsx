"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("Forgot password form submitted with email:", email);

    try {
      console.log("Sending forgot-password request to backend with email:", email);
      const response = await apiClient.post("/auth/forgot-password", { email });
      console.log("Forgot-password response:", response.data);
      
      setSubmitted(true);

      setTimeout(() => {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      console.error("Forgot-password error:", err);
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 px-4 py-6 sm:py-8 md:py-10">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0 gap-0 backdrop-blur-lg bg-white/95">
        <CardHeader className="text-center space-y-1 px-4 py-2 sm:px-6 sm:py-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 sm:p-4 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 shadow-xl">
              <Image
                src="/tea-blend-logo.svg"
                alt="Tea Blend AI"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Forgot Password</CardTitle>
          <CardDescription className="text-gray-600 text-xs sm:text-sm leading-tight tracking-tight px-1">
            Enter your email address to receive a secure reset code
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 px-4 py-3 sm:px-6 sm:py-4">
          {error && (
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {submitted && (
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200 animate-in fade-in">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-green-700 font-medium">
                OTP sent successfully! Redirecting...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700 tracking-tight">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="h-10 sm:h-12 rounded-full text-sm border-2 focus:border-green-500 focus:ring-green-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-10 sm:h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                  <span className="sm:hidden">Send...</span>
                </span>
              ) : (
                "Send Reset Code"
              )}
            </Button>
          </form>

          <div className="text-center text-xs sm:text-sm space-y-1 pt-2">
            <p className="text-gray-600 tracking-tight leading-tight">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors hover:underline tracking-tight">
                Login
              </Link>
            </p>
            <p className="text-gray-600 tracking-tight leading-tight">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-green-600 hover:text-green-700 font-semibold transition-colors hover:underline tracking-tight">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
