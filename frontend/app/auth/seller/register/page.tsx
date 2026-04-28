"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Building2, Calendar, Eye, EyeOff, FileBadge2, Globe, Lock, Mail, MapPin, Phone
} from "lucide-react"; // Icons for form fields
import { apiClient } from "@/lib/apiClient"; // Tool for sending backend requests
import { setStoredAuthToken } from "@/lib/auth"; // Auth tools

// --- Types ---
// Defines all the fields we need from a Seller when they sign up
type FormState = {
  sellerName: string;
  registrationNo: string;
  email: string;
  phoneNumber: string;
  startedYear: string;
  website: string;
  sellerDescription: string;
  streetAddress: string;
  province: string;
  city: string;
  postalCode: string;
  password: string;
  confirmPassword: string;
};

// Default empty state for the form
const initialFormState: FormState = {
  sellerName: "", registrationNo: "", email: "", phoneNumber: "", startedYear: "", website: "",
  sellerDescription: "", streetAddress: "", province: "", city: "", postalCode: "", password: "", confirmPassword: "",
};

function SellerRegisterContent() {
  // --- Next.js Hooks ---
  const router = useRouter(); // Used to redirect to another page
  const searchParams = useSearchParams(); // Used to read URL parameters (e.g., ?redirect=)
  
  // --- React State ---
  const [formData, setFormData] = useState<FormState>(initialFormState); // Form data
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false); // Checkbox state for terms
  const [isLoading, setIsLoading] = useState(false); // Controls the spinner on the submit button
  const [errorMsg, setErrorMsg] = useState(""); // Holds error messages

  // --- Password Validation Logic ---
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    symbol: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const hasStartedPassword = formData.password.length > 0;
  const hasStartedConfirmPassword = formData.confirmPassword.length > 0;
  const passwordsMatch = formData.password === formData.confirmPassword && hasStartedConfirmPassword;

  // --- Routing Helpers ---
  // Preserves any redirect path that was present in the URL when the user arrived
  const redirectPath = searchParams.get("redirect");
  const redirectSuffix = redirectPath && redirectPath.startsWith("/")
    ? `&redirect=${encodeURIComponent(redirectPath)}`
    : "";

  const loginHref = redirectPath && redirectPath.startsWith("/")
    ? `/auth/seller/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/auth/seller/login";

  // --- Handlers ---
  
  // Update the correct form field when the user types
  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    if (errorMsg) setErrorMsg(""); // Clear errors while typing
  };

  // Run checks before sending data to the server
  const validateForm = () => {
    const currentYear = new Date().getFullYear();
    const parsedStartedYear = Number(formData.startedYear);

    // Make sure the year is exactly 4 digits
    if (!/^\d{4}$/.test(formData.startedYear)) {
      setErrorMsg("Started year must be a valid 4-digit year.");
      return false;
    }

    // Make sure the year is reasonable (not the future, not too far in the past)
    if (parsedStartedYear < 1800 || parsedStartedYear > currentYear) {
      setErrorMsg(`Started year must be between 1800 and ${currentYear}.`);
      return false;
    }

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

  // Called when the user clicks "Create Seller Account"
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Stop page reload
    setErrorMsg(""); // Clear old errors

    // 1. Validate
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 2. Format Data for the Backend
      const parsedStartedYear = Number(formData.startedYear);
      
      // We take the "Seller Name" (e.g. "Green Tea Co") and split it up 
      // because the backend requires a personal first_name and last_name for the user account.
      const nameParts = formData.sellerName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Seller";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Account";
      
      // Auto-generate a username
      const userName = `${formData.email.split("@")[0]}${Math.floor(Math.random() * 1000)}`;
      
      // Combine the address fields into one string for the generic "shipping_address" field
      const shippingAddress = [
        formData.streetAddress.trim(),
        formData.city.trim(),
        formData.province.trim(),
        formData.postalCode.trim(),
      ].filter(Boolean).join(", ");

      // 3. Send API Request
      await apiClient.post("/auth/register", {
        // Shared Account Details
        email: formData.email.trim(),
        password: formData.password,
        first_name: firstName,
        last_name: lastName,
        user_name: userName,
        phone_num: formData.phoneNumber.trim(),
        shipping_address: shippingAddress,
        default_role: "seller", // Important: Start them as a seller
        
        // Specific Seller Details
        seller_name: formData.sellerName.trim(),
        seller_registration_no: formData.registrationNo.trim(),
        seller_started_year: parsedStartedYear,
        seller_website: formData.website.trim(),
        seller_description: formData.sellerDescription.trim(),
        seller_street_address: formData.streetAddress.trim(),
        seller_province: formData.province.trim(),
        seller_city: formData.city.trim(),
        seller_postal_code: formData.postalCode.trim(),
      });

      // 4. Success! Attempt auto-login
      try {
        const loginForm = new URLSearchParams();
        loginForm.append("username", formData.email.trim());
        loginForm.append("password", formData.password);

        const loginResponse = await apiClient.post<{ access_token: string }>("/auth/login", loginForm, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        if (loginResponse.data.access_token) {
          setStoredAuthToken(loginResponse.data.access_token);
          // Now that they are logged in, send them directly to the pending page
          router.push("/auth/pending");
          return;
        }
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
      }

      // 5. Fallback: Redirect to login page
      router.push(`/auth/seller/login?message=registration-success${redirectSuffix}`);
    } catch (error: any) {
      console.error("Seller signup error:", error);
      
      let errorMessage = "Failed to create your seller account. Please try again.";
      const detail = error.response?.data?.detail;
      
      if (detail) {
        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // Handle FastAPI / Pydantic validation errors
          errorMessage = detail.map((err: any) => `${err.loc?.slice(-1)?.[0] || 'Field'}: ${err.msg}`).join(" | ");
        }
      }
      
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
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
        <Link href="/auth" className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </header>

      <main className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          
          {/* Titles */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Create Seller Account
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
              Set up your seller profile to manage listings, auctions, and your marketplace presence on TeaBlend AI.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-2xl shadow-green-100/60 backdrop-blur-sm">
            <div className="border-b border-green-100 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_38%)] px-6 py-6 sm:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-green-700">
                Seller Registration
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600">
               Fill in your details below to create your Seller account, with secure verification and password recovery features.
              </p>
            </div>

            <div className="px-6 py-8 sm:px-8 sm:py-10">
              
              {/* Error Message */}
              {errorMsg && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Form starts here */}
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Business Details Section */}
                <section className="space-y-5">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-green-700">Business Details</h2>
                    <p className="mt-1 text-sm text-gray-500">Tell us about your seller identity and marketplace presence.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="seller-name" className="mb-2 block text-sm font-semibold text-gray-700">Seller Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="seller-name" type="text" value={formData.sellerName} onChange={handleChange("sellerName")} required placeholder="Enter seller or company name" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="registration-no" className="mb-2 block text-sm font-semibold text-gray-700">Registration No</label>
                      <div className="relative">
                        <FileBadge2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="registration-no" type="text" value={formData.registrationNo} onChange={handleChange("registrationNo")} required placeholder="Enter business registration number" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="email" type="email" value={formData.email} onChange={handleChange("email")} required placeholder="seller@example.com" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone-number" className="mb-2 block text-sm font-semibold text-gray-700">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="phone-number" type="tel" value={formData.phoneNumber} onChange={handleChange("phoneNumber")} required placeholder="+94 77 123 4567" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="started-year" className="mb-2 block text-sm font-semibold text-gray-700">Started Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="started-year" type="text" value={formData.startedYear} onChange={handleChange("startedYear")} required inputMode="numeric" maxLength={4} placeholder="e.g. 2016" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="website" className="mb-2 block text-sm font-semibold text-gray-700">
                        Website <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="website" type="url" value={formData.website} onChange={handleChange("website")} placeholder="https://yourbusiness.com" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="seller-description" className="mb-2 block text-sm font-semibold text-gray-700">Seller Description</label>
                    <textarea id="seller-description" value={formData.sellerDescription} onChange={handleChange("sellerDescription")} required placeholder="Describe your business, specialties, and tea marketplace experience" className="min-h-[140px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </section>

                {/* 2. Address Section */}
                <section className="space-y-5 border-t border-green-100 pt-8">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-green-700">Address</h2>
                    <p className="mt-1 text-sm text-gray-500">Enter your primary seller or company address.</p>
                  </div>

                  <div>
                    <label htmlFor="street-address" className="mb-2 block text-sm font-semibold text-gray-700">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                      <textarea id="street-address" value={formData.streetAddress} onChange={handleChange("streetAddress")} required placeholder="Enter street address" className="min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                      <label htmlFor="province" className="mb-2 block text-sm font-semibold text-gray-700">Province</label>
                      <input id="province" type="text" value={formData.province} onChange={handleChange("province")} required placeholder="Province" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                    <div>
                      <label htmlFor="city" className="mb-2 block text-sm font-semibold text-gray-700">City</label>
                      <input id="city" type="text" value={formData.city} onChange={handleChange("city")} required placeholder="City" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                    <div>
                      <label htmlFor="postal-code" className="mb-2 block text-sm font-semibold text-gray-700">Postal Code</label>
                      <input id="postal-code" type="text" value={formData.postalCode} onChange={handleChange("postalCode")} required placeholder="Postal code" className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                  </div>
                </section>

                {/* 3. Security Section (Passwords) */}
                <section className="space-y-5 border-t border-green-100 pt-8">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-green-700">Security</h2>
                    <p className="mt-1 text-sm text-gray-500">Use at least 8 characters with uppercase, lowercase, number, and symbol.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange("password")} required placeholder="Create a strong password" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                        <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Password requirements UI */}
                      {hasStartedPassword && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Password requirements</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <p className={`text-xs ${passwordChecks.minLength ? "text-green-700" : "text-red-600"}`}>{passwordChecks.minLength ? "OK" : "NO"} At least 8 characters</p>
                            <p className={`text-xs ${passwordChecks.uppercase ? "text-green-700" : "text-red-600"}`}>{passwordChecks.uppercase ? "OK" : "NO"} One uppercase letter</p>
                            <p className={`text-xs ${passwordChecks.lowercase ? "text-green-700" : "text-red-600"}`}>{passwordChecks.lowercase ? "OK" : "NO"} One lowercase letter</p>
                            <p className={`text-xs ${passwordChecks.number ? "text-green-700" : "text-red-600"}`}>{passwordChecks.number ? "OK" : "NO"} One number</p>
                            <p className={`text-xs ${passwordChecks.symbol ? "text-green-700" : "text-red-600"}`}>{passwordChecks.symbol ? "OK" : "NO"} One symbol</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-gray-700">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange("confirmPassword")} required placeholder="Repeat your password" className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                        <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Passwords Match feedback */}
                      {hasStartedConfirmPassword && (
                        <p className={`mt-3 text-xs font-medium ${passwordsMatch ? "text-green-700" : "text-red-600"}`}>
                          {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 4. Terms and Submit button */}
                <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={agreeTerms} onChange={(event) => setAgreeTerms(event.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="text-sm leading-6 text-gray-700">
                      I agree to the <Link href="/terms" className="font-semibold text-green-700 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-green-700 hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !agreeTerms}
                  className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 text-base font-semibold text-white shadow-lg shadow-green-200 transition hover:from-green-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating Seller Account...
                    </span>
                  ) : "Create Seller Account"}
                </button>

                {/* Link to Login */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Already have a seller account? <Link href={loginHref} className="font-semibold text-green-700 transition hover:text-green-800 hover:underline">Sign in</Link>
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

export default function SellerRegisterPage() {
  return (
    <ReactSuspense fallback={<div>Loading...</div>}>
      <SellerRegisterContent />
    </ReactSuspense>
  );
}
