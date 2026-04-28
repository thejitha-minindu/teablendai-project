"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff, ArrowLeft, Lock, KeyRound } from "lucide-react"; // Icons
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

  // Determine back button href
  const backHref = role === "buyer" || role === "seller" 
    ? `/auth/forgot-password?role=${role}` 
    : "/auth/forgot-password";

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

  // Password strength checks
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  // --- Security Check (Effect) ---
  // If the user arrives here without the required security tokens (email, resetId, otpCode),
  // they probably typed the URL directly. We kick them back to the forgot password page.
  useEffect(() => {
    if (!email || !resetId || !otpCode) {
      router.push(`/auth/forgot-password${sharedRoleSuffix}`);
    }
  }, [email, resetId, otpCode, router, sharedRoleSuffix]);

  // Update password strength when new password changes
  useEffect(() => {
    setPasswordStrength({
      length: formData.newPassword.length >= 8,
      uppercase: /[A-Z]/.test(formData.newPassword),
      lowercase: /[a-z]/.test(formData.newPassword),
      number: /\d/.test(formData.newPassword),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)
    });
  }, [formData.newPassword]);

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
                  Reset Password
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Enter your new password below
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  for {email}
                </p>
              </div>

              {/* Error Message Box */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-700 flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </div>
              )}

              {/* Success Message Box */}
              {success && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-2.5 text-center text-xs font-medium text-green-700 flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Password reset successful! Redirecting...
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-xs font-semibold text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"} // Switches between text and hidden dots
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange("newPassword", e.target.value)}
                      placeholder="Enter new password"
                      className="h-10 rounded-lg border pl-9 pr-9 text-sm focus:border-green-500 focus:ring-green-500/20"
                      disabled={loading || success}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.newPassword.length > 0 && (
                    <div className="mt-2 space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Password requirements
                      </p>
                      <div className="grid gap-1.5">
                        <p className={`text-xs ${passwordStrength.length ? "text-green-700" : "text-red-600"}`}>
                          ✓ {passwordStrength.length ? "OK" : "NO"} At least 8 characters
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <p className={`text-xs ${passwordStrength.uppercase ? "text-green-700" : "text-red-600"}`}>
                            ✓ {passwordStrength.uppercase ? "OK" : "NO"} Uppercase letter
                          </p>
                          <p className={`text-xs ${passwordStrength.lowercase ? "text-green-700" : "text-red-600"}`}>
                            ✓ {passwordStrength.lowercase ? "OK" : "NO"} Lowercase letter
                          </p>
                          <p className={`text-xs ${passwordStrength.number ? "text-green-700" : "text-red-600"}`}>
                            ✓ {passwordStrength.number ? "OK" : "NO"} Number
                          </p>
                          <p className={`text-xs ${passwordStrength.specialChar ? "text-green-700" : "text-red-600"}`}>
                            ✓ {passwordStrength.specialChar ? "OK" : "NO"} Special character
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"} // Switches between text and hidden dots
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="Confirm your password"
                      className="h-10 rounded-lg border pl-9 pr-9 text-sm focus:border-green-500 focus:ring-green-500/20"
                      disabled={loading || success}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password match indicator */}
                  {formData.confirmPassword.length > 0 && (
                    <p className={`mt-1.5 text-xs font-medium ${
                      formData.newPassword === formData.confirmPassword 
                        ? "text-green-700" 
                        : "text-red-600"
                    }`}>
                      {formData.newPassword === formData.confirmPassword 
                        ? "✓ Passwords match" 
                        : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || success}
                  className="h-10 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all duration-300 hover:from-green-700 hover:to-emerald-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Resetting...</span>
                    </span>
                  ) : success ? (
                    <span className="text-sm">Done!</span>
                  ) : (
                    <span className="text-sm">Reset Password</span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}