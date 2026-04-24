"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const resetId = searchParams.get("reset_id") || "";
  const otpCode = searchParams.get("otp_code") || "";

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email || !resetId || !otpCode) {
      router.push("/auth/forgot-password");
    }
  }, [email, resetId, otpCode, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateForm = () => {
    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError("Password must contain uppercase, lowercase, number & special character");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        email,
        otp_code: otpCode,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      });

      setSuccess(true);

      setTimeout(() => {
        router.push("/auth/login?message=password-reset-success");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetId || !otpCode) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 px-4 py-6 sm:py-8 md:py-10">
      
      <Card className="w-full max-w-md shadow-2xl rounded-2xl border-0 backdrop-blur-lg bg-white/95">
        
        {/* Header */}
        <CardHeader className="text-center space-y-1 px-4 py-2 sm:px-6">
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

          <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            Reset Password
          </CardTitle>

          <CardDescription className="text-gray-600 text-xs sm:text-sm px-1">
            Enter your new password below
          </CardDescription>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-3 px-4 py-3 sm:px-6 sm:py-4">

          {/* Error */}
          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <p className="text-xs sm:text-sm text-green-700">
                Password reset successful! Redirecting...
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* New Password */}
            <div className="relative">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                className="h-10 sm:h-12 rounded-full pr-10 border-2 focus:border-green-500"
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="h-10 sm:h-12 rounded-full pr-10 border-2 focus:border-green-500"
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-[38px] text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Button */}
            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-10 sm:h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold shadow-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </span>
              ) : success ? (
                "Done!"
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-xs sm:text-sm pt-2">
            <Link
              href="/auth/forgot-password"
              className="text-green-600 hover:underline flex justify-center items-center gap-1"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}