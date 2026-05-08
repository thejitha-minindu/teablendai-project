"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { setStoredAuthToken } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";

function getSafeRedirectPath(redirectPath: string | null) {
  if (!redirectPath || !redirectPath.startsWith("/")) {
    return null;
  }
  return redirectPath;
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await apiClient.post("/auth/admin/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setStoredAuthToken(response.data.access_token);
      
      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      }
      
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Admin login failed:", error);
      setErrorMsg(error.response?.data?.detail || "Invalid admin credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <img src="/Tealogo.png" className="h-15 w-35" alt="Tea Blend AI Logo" />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-green-700 transition backdrop-blur-sm hover:bg-green-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Site
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white/95 shadow-2xl shadow-purple-100/60 backdrop-blur-sm">
            
            {/* Login Form */}
            <div className="flex flex-col p-6 sm:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Admin Portal
                </h1>
                <p className="mt-1 text-sm text-gray-600">Secure access for system administrators</p>
                <p className="mt-1 text-xs text-gray-500">Manage users, auctions, and platform settings</p>
              </div>

              {errorMsg && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleStandardLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                    Admin Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@teablendai.com"
                      className="h-11 rounded-lg border-gray-200 pl-10 text-sm focus:border-purple-500 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password?role=admin"
                      className="text-xs text-green-600 transition-colors hover:text-green-700 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secure password"
                      className="h-11 rounded-lg border-gray-200 pl-10 pr-10 text-sm focus:border-purple-500 focus:ring-purple-500/20"
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
                </div>

                <Button
                      type="submit"
                      className="h-10 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all duration-300 hover:from-green-700 hover:to-emerald-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="text-sm">Authenticating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm">Secure Login</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </Button>
              </form>

              <div className="mt-6 space-y-3">
                <div className="text-center text-xs text-gray-600">
                  By continuing, you agree to our{" "}
                  <Link href="/terms" className="text-green-600 hover:text-green-700 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-green-600 hover:text-green-700 hover:underline">
                    Privacy Policy
                  </Link>
                </div>

                {/* 2FA Notice */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-3 w-3" />
                  <span>2FA available for enhanced security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}