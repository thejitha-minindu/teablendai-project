"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"; // Icons
import { apiClient } from "@/lib/apiClient"; // Tool for backend communication

export default function ResetPasswordPage() {
  // --- Next.js Hooks ---
  const router = useRouter(); // Used for navigation
  const searchParams = useSearchParams(); // Used to read data passed in the URL
  
  // Read the security parameters passed from the OTP page
  const email = searchParams.get("email") || "";
  const resetId = searchParams.get("reset_id") || "";
  const otpCode = searchParams.get("otp_code") || "";
  const role = searchParams.get("role");
  
  // Helpers to keep the role in the URL
  const sharedRoleSuffix =
    role === "buyer" || role === "seller" ? `?role=${role}` : "";

  // --- React State ---
  // Stores the passwords the user types
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // UI Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // --- Security Check (Effect) ---
  // If the user arrives here without the required security tokens (email, resetId, otpCode),
  // they probably typed the URL directly. We kick them back to the forgot password page.
  useEffect(() => {
    if (!email || !resetId || !otpCode) {
      router.push(`/auth/forgot-password${sharedRoleSuffix}`);
    }
  }, [email, resetId, otpCode, router, sharedRoleSuffix]);

  // --- Handlers ---
  
  // Updates the form state when the user types
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear errors while they type
  };

  // Validates the password strength before we send it to the server
  const validateForm = () => {
    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Checking for specific characters using Regular Expressions (Regex)
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError("Password must contain uppercase, lowercase, number & special character");
      return false;
    }

    return true; // Form is valid!
  };

  // Called when the user clicks "Reset Password"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop page reload

    // Run our checks first
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. API Call: Send the new password to the server, along with the OTP tokens to prove we are allowed to change it.
      await apiClient.post("/auth/reset-password", {
        email,
        otp_code: otpCode,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword
      });

      // 2. Success!
      setSuccess(true);

      // 3. Wait 3 seconds, then redirect to the login page so they can log in with the new password
      setTimeout(() => {
        const loginHref =
          role === "buyer" || role === "seller"
            ? `/auth/${role}/login`
            : "/auth/login";
        router.push(`${loginHref}?message=password-reset-success`);
      }, 3000);
    } catch (err: any) {
      // 4. Handle errors (e.g., token expired while they were typing)
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Prevent rendering if the security tokens are missing (the useEffect will redirect them)
  if (!email || !resetId || !otpCode) return null;

  // --- UI Render ---
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

          {/* Error Message Box */}
          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message Box */}
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

            {/* New Password Input */}
            <div className="relative">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                type={showPassword ? "text" : "password"} // Switches between text and hidden dots
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

            {/* Confirm Password Input */}
            <div className="relative">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                type={showConfirmPassword ? "text" : "password"} // Switches between text and hidden dots
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

            {/* Submit Button */}
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

          {/* Footer Back Link */}
          <div className="text-center text-xs sm:text-sm pt-2">
            <Link
              href={`/auth/forgot-password${sharedRoleSuffix}`}
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
