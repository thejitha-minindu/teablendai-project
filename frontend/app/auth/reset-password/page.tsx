"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const resetId = searchParams.get("reset_id") || "";

  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email || !resetId) {
      router.push("/auth/forgot-password");
    }
  }, [email, resetId, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/auth/reset-password", {
        email,
        otp_code: formData.otp,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      });

      setSuccess(true);

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/login?message=password-reset-success");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !resetId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your OTP and new password
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Password reset successful! Redirecting to login...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 mb-2 block">
                6-Digit OTP Code
              </label>
              <Input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
                disabled={loading || success}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading || success}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading || success}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success || !formData.otp || !formData.newPassword || !formData.confirmPassword}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : success ? (
                "Password Reset!"
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2 text-sm">
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
              <strong>Password Requirements:</strong> At least 8 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}