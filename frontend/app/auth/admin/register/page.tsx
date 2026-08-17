"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, ShieldAlert } from "lucide-react";
import authService from "@/services/authService";

type FormState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function AdminRegisterContent() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    if (errorMsg) {
      setErrorMsg("");
    }
  };

  const validateForm = () => {
    if (!isPasswordStrong) {
      setErrorMsg("Password must include uppercase, lowercase, number, and symbol.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await authService.registerAdmin(
        formData.email.trim(),
        formData.password,
        formData.username.trim(),
        formData.firstName.trim(),
        formData.lastName.trim()
      );

      router.push("/auth/admin/login?message=registration-pending");
    } catch (error: any) {
      console.error("Admin registration error:", error);
      setErrorMsg(
        error.response?.data?.detail || "Failed to submit registration request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-purple-950 text-gray-100">
      {/* Header NavBar */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <img src="/TeaLogo.png" alt="Tea Blend AI Logo" className="h-15 w-35 brightness-110 contrast-125" />
        </Link>
        <Link href="/auth/admin/login" className="inline-flex items-center gap-2 rounded-full border border-purple-800/40 bg-purple-950/40 px-5 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-900/40">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </header>

      <main className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Page Titles */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Request Admin Access
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
              Submit your registration request to join the platform administration team. All requests must be approved by the system super administrator.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-purple-500/20 bg-gray-900/80 shadow-2xl shadow-purple-500/5 backdrop-blur-sm">
            <div className="border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent px-6 py-6 sm:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">
                Admin Registration
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400">
                Please enter your credentials below. Your account status will remain pending until a system superadmin approves the request.
              </p>
            </div>

            <div className="px-6 py-8 sm:px-8 sm:py-10">
              {errorMsg && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Details Section */}
                <section className="space-y-5">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-purple-400">
                      Personal Details
                    </h2>
                    <p className="mt-1 text-sm text-gray-450">
                      Used for display names and admin contact info.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="first-name" className="mb-2 block text-sm font-semibold text-gray-350">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          id="first-name"
                          type="text"
                          value={formData.firstName}
                          onChange={handleChange("firstName")}
                          required
                          placeholder="Enter first name"
                          className="h-12 w-full rounded-2xl border border-gray-800 bg-gray-950 pl-12 pr-4 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="last-name" className="mb-2 block text-sm font-semibold text-gray-350">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          id="last-name"
                          type="text"
                          value={formData.lastName}
                          onChange={handleChange("lastName")}
                          required
                          placeholder="Enter last name"
                          className="h-12 w-full rounded-2xl border border-gray-800 bg-gray-950 pl-12 pr-4 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="username" className="mb-2 block text-sm font-semibold text-gray-355">Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={handleChange("username")}
                          required
                          placeholder="admin_username"
                          className="h-12 w-full rounded-2xl border border-gray-800 bg-gray-950 pl-12 pr-4 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-355">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange("email")}
                          required
                          placeholder="admin@teablendai.com"
                          className="h-12 w-full rounded-2xl border border-gray-800 bg-gray-950 pl-12 pr-4 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Security Section (Passwords) */}
                <section className="space-y-5 border-t border-purple-950 pt-8">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.10em] text-purple-400">
                      Security
                    </h2>
                    <p className="mt-1 text-sm text-gray-450">
                      Create a strong password for secure admin panel access.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-355">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange("password")}
                          required
                          placeholder="Create a strong password"
                          className="h-12 w-full rounded-2xl border border-gray-800 bg-gray-950 pl-12 pr-12 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {hasStartedPassword && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-gray-800 bg-gray-950/60 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Password requirements
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <p className={`text-xs ${passwordChecks.minLength ? "text-green-400" : "text-red-400"}`}>
                              {passwordChecks.minLength ? "✓" : "✗"} At least 8 characters
                            </p>
                            <p className={`text-xs ${passwordChecks.uppercase ? "text-green-400" : "text-red-400"}`}>
                              {passwordChecks.uppercase ? "✓" : "✗"} One uppercase letter
                            </p>
                            <p className={`text-xs ${passwordChecks.lowercase ? "text-green-400" : "text-red-400"}`}>
                              {passwordChecks.lowercase ? "✓" : "✗"} One lowercase letter
                            </p>
                            <p className={`text-xs ${passwordChecks.number ? "text-green-400" : "text-red-400"}`}>
                              {passwordChecks.number ? "✓" : "✗"} One number
                            </p>
                            <p className={`text-xs ${passwordChecks.symbol ? "text-green-400" : "text-red-400"}`}>
                              {passwordChecks.symbol ? "✓" : "✗"} One symbol
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-gray-355">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleChange("confirmPassword")}
                          required
                          placeholder="Repeat your password"
                          className="h-12 w-full rounded-2xl border border-gray-800 bg-gray-950 pl-12 pr-12 text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {hasStartedConfirmPassword && (
                        <p className={`mt-3 text-xs font-medium ${passwordsMatch ? "text-green-400" : "text-red-400"}`}>
                          {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-500 px-4 text-base font-semibold text-white shadow-lg shadow-purple-500/10 transition hover:from-purple-700 hover:to-indigo-650 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting Request...
                    </span>
                  ) : (
                    "Submit Access Request"
                  )}
                </button>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-center">
                  <p className="text-sm text-gray-400">
                    Already have an admin account?{" "}
                    <Link href="/auth/admin/login" className="font-semibold text-purple-400 transition hover:text-purple-300 hover:underline">
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

export default function AdminRegisterPage() {
  return (
    <ReactSuspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminRegisterContent />
    </ReactSuspense>
  );
}
