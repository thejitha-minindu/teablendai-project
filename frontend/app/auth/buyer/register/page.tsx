"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, Lock, Mail, MapPin, Phone, User
} from "lucide-react"; // Icons for the form fields
import authService from "@/services/authService"; // Service layer for auth API calls
import { setStoredAuthToken } from "@/lib/auth"; // Auth tools

// --- Types ---
// This defines exactly what information we need to collect for a buyer
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

// Start with empty form fields
const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

function BuyerRegisterContent() {
  // --- Next.js Hooks ---
  const router = useRouter(); // For redirecting after success
  const searchParams = useSearchParams(); // To read the URL (e.g. ?redirect=/cart)
  
  // --- React State ---
  const [formData, setFormData] = useState<FormState>(initialFormState); // Holds all the typed text
  const [showPassword, setShowPassword] = useState(false); // Toggles hiding/showing password dots
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false); // Checkbox for terms of service
  const [isLoading, setIsLoading] = useState(false); // Controls the loading spinner
  const [errorMsg, setErrorMsg] = useState(""); // Holds error messages if something fails

  // --- Password Validation Logic ---
  // We check the password against several rules as they type it
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password), // Has an uppercase letter (A-Z)
    lowercase: /[a-z]/.test(formData.password), // Has a lowercase letter (a-z)
    number: /\d/.test(formData.password), // Has a number (0-9)
    symbol: /[^A-Za-z0-9]/.test(formData.password), // Has a special character (!@# etc)
  };

  // The password is "strong" only if EVERY check is true
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  
  const hasStartedPassword = formData.password.length > 0;
  const hasStartedConfirmPassword = formData.confirmPassword.length > 0;
  
  // Check if the two passwords match
  const passwordsMatch = formData.password === formData.confirmPassword && hasStartedConfirmPassword;

  // --- Routing Helpers ---
  // If they came from a specific page (like checkout), we want to send them back there after they log in
  const redirectPath = searchParams.get("redirect");
  const redirectSuffix = redirectPath && redirectPath.startsWith("/")
    ? `&redirect=${encodeURIComponent(redirectPath)}`
    : "";

  const loginHref = redirectPath && redirectPath.startsWith("/")
    ? `/auth/buyer/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/auth/buyer/login";

  // --- Form Handlers ---
  
  // Updates the form state whenever the user types in an input box
  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    if (errorMsg) {
      setErrorMsg(""); // Clear errors when they start typing again
    }
  };

  // Checks the form right before submitting to the backend
  const validateForm = () => {
    if (!isPasswordStrong) {
      setErrorMsg("Password must include uppercase, lowercase, number, and symbol.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return false;
    }

    return true; // Form is valid!
  };

  // Called when they click "Create Buyer Account"
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Stop the page from reloading
    setErrorMsg(""); // Clear old errors

    // 1. Validate
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 2. Prepare Data
      // The backend requires a `user_name`, so we generate one automatically from their email
      const userName = `${formData.firstName.trim().toLowerCase()}${Math.floor(Math.random() * 1000)}`;

      // 3. Register via the service layer
      await authService.register(
        formData.email.trim(),
        formData.password,
        userName,
        formData.firstName.trim(),
        formData.lastName.trim(),
        formData.phoneNumber.trim(),
        "buyer",
        formData.address.trim()
      );

      // 4. Success! Attempt auto-login so the buyer can land on the pending page immediately
      try {
        const loginResponse = await authService.login(formData.email.trim(), formData.password);

        if (loginResponse.access_token) {
          setStoredAuthToken(loginResponse.access_token);
          router.push("/auth/pending");
          return;
        }
      } catch (loginError) {
        console.error("Buyer auto-login failed:", loginError);
      }

      // 5. Fallback: Send them to the buyer login page
      router.push(`/auth/buyer/login?message=registration-success${redirectSuffix}`);
    } catch (error: any) {
      // 6. Handle Errors (like if the email is already in use)
      console.error("Buyer signup error:", error);
      setErrorMsg(
        error.response?.data?.detail || "Failed to create your buyer account. Please try again."
      );
    } finally {
      setIsLoading(false); // Hide the loading spinner
    }
  };

  // --- UI Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      
      {/* Header NavBar */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <img src="/Tealogo.png" alt="Tea Blend AI Logo" className="h-15 w-35" />
        </Link>
        <Link href="/auth" className="inline-flex items-center gap-2 rounded-full border border-green-800 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>

      <main className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          
          {/* Page Titles */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Create Buyer Account
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Set up your buyer profile to explore auctions, manage orders, and purchase tea with confidence on TeaBlend AI.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-2xl shadow-green-100/60 backdrop-blur-sm">
            <div className="border-b border-green-100 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_30%)] px-6 py-6 sm:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">
                Buyer Registration
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
                Fill in your details below. Your account will be created under the buyer role and can use the shared password recovery and verification
              </p>
            </div>

            <div className="px-6 py-8 sm:px-8 sm:py-10">
              
              {/* Error Message Box */}
              {errorMsg && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* The Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Personal Details Section */}
                <section className="space-y-5">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-green-700">
                      Personal Details
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Use the contact information associated with your buyer profile.
                    </p>
                  </div>

                  {/* Name Inputs */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="first-name" className="mb-2 block text-sm font-semibold text-gray-700">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          id="first-name"
                          type="text"
                          value={formData.firstName}
                          onChange={handleChange("firstName")}
                          required
                          placeholder="Enter first name"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="last-name" className="mb-2 block text-sm font-semibold text-gray-700">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          id="last-name"
                          type="text"
                          value={formData.lastName}
                          onChange={handleChange("lastName")}
                          required
                          placeholder="Enter last name"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email and Phone Inputs */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange("email")}
                          required
                          placeholder="yourname@gmail.com"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone-number" className="mb-2 block text-sm font-semibold text-gray-700">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          id="phone-number"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={handleChange("phoneNumber")}
                          required
                          placeholder="+94 77 123 4567"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Input */}
                  <div>
                    <label htmlFor="address" className="mb-2 block text-sm font-semibold text-gray-700">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <textarea
                        id="address"
                        value={formData.address}
                        onChange={handleChange("address")}
                        required
                        placeholder="Enter your delivery or billing address"
                        className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                  </div>
                </section>

                {/* 2. Security Section (Passwords) */}
                <section className="space-y-5 border-t border-green-100 pt-8">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-green-700">
                      Security
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Use at least 8 characters with uppercase, lowercase, number, and symbol.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    
                    {/* Password Input */}
                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange("password")}
                          required
                          placeholder="Create a strong password"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Strength Checklist */}
                      {hasStartedPassword && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Password requirements
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <p className={`text-xs ${passwordChecks.minLength ? "text-green-700" : "text-red-600"}`}>
                              {passwordChecks.minLength ? "OK" : "NO"} At least 8 characters
                            </p>
                            <p className={`text-xs ${passwordChecks.uppercase ? "text-green-700" : "text-red-600"}`}>
                              {passwordChecks.uppercase ? "OK" : "NO"} One uppercase letter
                            </p>
                            <p className={`text-xs ${passwordChecks.lowercase ? "text-green-700" : "text-red-600"}`}>
                              {passwordChecks.lowercase ? "OK" : "NO"} One lowercase letter
                            </p>
                            <p className={`text-xs ${passwordChecks.number ? "text-green-700" : "text-red-600"}`}>
                              {passwordChecks.number ? "OK" : "NO"} One number
                            </p>
                            <p className={`text-xs ${passwordChecks.symbol ? "text-green-700" : "text-red-600"}`}>
                              {passwordChecks.symbol ? "OK" : "NO"} One symbol
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                      <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-gray-700">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleChange("confirmPassword")}
                          required
                          placeholder="Repeat your password"
                          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password Match Message */}
                      {hasStartedConfirmPassword && (
                        <p className={`mt-3 text-xs font-medium ${passwordsMatch ? "text-green-700" : "text-red-600"}`}>
                          {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. Terms and Submit */}
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(event) => setAgreeTerms(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm leading-6 text-gray-700">
                      I agree to the{" "}
                      <Link href="/terms" className="font-semibold text-green-700 hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="font-semibold text-green-700 hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !agreeTerms} // Button disabled until terms are checked
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 text-base font-semibold text-white shadow-lg shadow-green-200 transition hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Buyer Account...
                    </span>
                  ) : (
                    "Create Buyer Account"
                  )}
                </button>

                {/* Switch to Login Link */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Already have a buyer account?{" "}
                    <Link href={loginHref} className="font-semibold text-green-700 transition hover:text-green-800 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { Suspense as ReactSuspense } from "react";

export default function BuyerRegisterPage() {
  return (
    <ReactSuspense fallback={<div>Loading...</div>}>
      <BuyerRegisterContent />
    </ReactSuspense>
  );
}
