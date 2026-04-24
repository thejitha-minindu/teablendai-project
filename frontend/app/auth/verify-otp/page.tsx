"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/verify-otp", {
        email,
        otp_code: otp,
      });

      setSuccess(true);
      setMessage("OTP verified! Redirecting...");

      setTimeout(() => {
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(email)}&reset_id=${response.data.password_reset_id}&otp_code=${encodeURIComponent(otp)}`
        );
      }, 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setMessage("");
    setLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setMessage("New OTP sent successfully!");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

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

          {/* MESSAGE */}
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
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              className="h-12 text-center text-lg tracking-widest rounded-full border-2 focus:border-green-500"
              maxLength={6}
              required
            />

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
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

          {/* RESEND */}
          <div className="text-center text-sm">
            <p className="text-gray-600">
              Didn’t receive code?{" "}
              <button
                onClick={handleResendOTP}
                className="text-green-600 font-semibold hover:underline"
                disabled={loading}
              >
                Resend OTP
              </button>
            </p>
          </div>

          {/* BACK */}
          <div className="text-center pt-2">
            <Link
              href="/auth/forgot-password"
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