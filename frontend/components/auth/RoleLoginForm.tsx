"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, Mail, ArrowLeft, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getAuthClaims, getHomePathByRole, setStoredAuthToken, type UserRole } from "@/lib/auth";
import { apiClient } from "@/lib/apiClient";
import authService from "@/services/authService";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

function getSafeRedirectPath(redirectPath: string | null) {
  if (!redirectPath || !redirectPath.startsWith("/")) {
    return null;
  }
  return redirectPath;
}

interface RoleLoginFormProps {
  role: UserRole;
}

const ROLE_CONFIG = {
  buyer: {
    title: "Buyer Sign In",
    subtitle: "Access auctions, orders, and your TeaBlend AI dashboard",
    description: "Please sign in to continue your tea blending journey",
    icon: User,
    imageAlt: "Tea buyer exploring products",
    registerPath: "/auth/buyer/register",
    forgotPasswordPath: "/auth/forgot-password?role=buyer",
    leftImageText: "Discover Premium Tea Blends",
    leftImageSubtext: "Access exclusive auctions and track your orders from trusted sellers worldwide.",
  },
  seller: {
    title: "Seller Sign In",
    subtitle: "Manage auctions, listings, and your seller workspace",
    description: "Please sign in to manage your tea business",
    icon: Store,
    imageAlt: "Tea seller managing inventory",
    registerPath: "/auth/seller/register",
    forgotPasswordPath: "/auth/forgot-password?role=seller",
    leftImageText: "Grow Your Tea Business",
    leftImageSubtext: "List products, manage auctions, and reach more customers with our marketplace tools.",
  },
};

export function RoleLoginForm({ role }: RoleLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));
  const config = ROLE_CONFIG[role];
  const IconComponent = config.icon;

  const routeApprovedUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const verificationStatus = currentUser.verification_status || "PENDING";

      if (verificationStatus === "PENDING") {
        router.push("/auth/pending");
        return;
      }

      if (verificationStatus === "REJECTED") {
        router.push("/auth/rejected");
        return;
      }

      if (verificationStatus === "APPROVED") {
        router.push(redirectPath || getHomePathByRole(currentUser.default_role));
      }
    } catch (fetchError) {
      console.error("Failed to fetch current user:", fetchError);
      const claims = getAuthClaims();
      const status = claims?.status;

      if (status === "PENDING") {
        router.push("/auth/pending");
        return;
      }
      if (status === "REJECTED") {
        router.push("/auth/rejected");
        return;
      }
      if (status === "APPROVED") {
        router.push(redirectPath || getHomePathByRole(claims?.role));
      }
    }
  };

  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password-reset-success") {
      setSuccessMsg("Password reset successful! You can now log in with your new password.");
    } else if (message === "registration-success") {
      setSuccessMsg("Account created successfully. Please sign in to continue.");
    }
  }, [searchParams]);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await apiClient.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setStoredAuthToken(response.data.access_token);
      
      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      }
      
      await routeApprovedUser();
    } catch (error: any) {
      console.error("Login failed:", error);
      setErrorMsg(error.response?.data?.detail || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setErrorMsg("");
    try {
      const response = await apiClient.post("/auth/google", {
        token: credentialResponse.credential,
      });

      setStoredAuthToken(response.data.access_token);
      await routeApprovedUser();
    } catch (error) {
      console.error("Google login failed:", error);
      setErrorMsg("Google authentication failed. Please try again.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-green-50">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/Tealogo.png" className="h-15 w-35" alt="Tea Blend AI Logo" />
          </Link>

          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-green-700 transition backdrop-blur-sm hover:bg-green-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex h-full items-center justify-center">
          <div className="w-full max-w-6xl px-4">
            <div className="grid overflow-hidden rounded-2xl border border-green-100 bg-white/95 shadow-2xl shadow-green-100/60 backdrop-blur-sm lg:grid-cols-2">
              {/* Left Side - Image Section */}
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 to-emerald-500/30 z-10 rounded-l-2xl"></div>
                <img
                  src={role === "buyer" ? "/login-image.webp" : "/login-image.webp"}
                  alt={config.imageAlt}
                  className="h-full w-full object-cover rounded-l-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-20 rounded-l-2xl"></div>
                <div className="absolute bottom-0 left-0 right-0 z-30 p-6 text-white">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-0.5 w-10 bg-green-400 rounded-full"></div>
                    <span className="text-xs font-medium tracking-wide">
                      {role === "buyer" ? "Buyer Portal" : "Seller Portal"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{config.leftImageText}</h2>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {config.leftImageSubtext}
                  </p>
                </div>
              </div>

              {/* Right Side - Login Form */}
              <div className="flex max-h-[90vh] flex-col overflow-y-auto p-6 sm:p-8">
                <div className="mb-5 text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {config.title}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">{config.subtitle}</p>
                  <p className="mt-1 text-xs text-gray-500">{config.description}</p>
                </div>

                {/* Messages */}
                {successMsg && (
                  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-2.5 text-center text-xs font-medium text-green-700 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {successMsg}
                  </div>
                )}

                {errorMsg && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-700">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Google Sign-In */}
                  <div className="flex justify-center w-full">
                    <div className="w-full flex justify-center bg-white border hover:bg-gray-50 transition-colors rounded-full overflow-hidden [&>div]:w-full [&>div>div]:w-full [&>div>div>iframe]:w-full">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setErrorMsg("Google Login Failed")}
                        useOneTap
                        theme="outline"
                        size="large"
                        shape="pill"
                        text="continue_with"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Separator className="my-4" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-gray-500">
                      or sign in with email
                    </span>
                  </div>

                  {/* Email & Password Form */}
                  <form onSubmit={handleStandardLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-10 rounded-lg border pl-9 text-sm focus:border-green-500 focus:ring-green-500/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
                          Password
                        </Label>
                        <Link
                          href={config.forgotPasswordPath}
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
                          placeholder="Enter your password"
                          className="h-10 rounded-lg border pl-9 pr-9 text-sm focus:border-green-500 focus:ring-green-500/20"
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

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor="remember" className="cursor-pointer text-xs text-gray-700">
                        Remember me for 30 days
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="h-10 w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-500 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all duration-300 hover:from-green-700 hover:to-emerald-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="text-sm">Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm">Sign In</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </Button>
                  </form>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="text-center text-xs text-gray-600">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="text-green-600 hover:underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-green-600 hover:underline">
                      Privacy
                    </Link>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-center">
                    <p className="text-xs text-gray-600">
                      Don&apos;t have a {role} account?{" "}
                      <Link
                        href={`${config.registerPath}${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                        className="inline-flex items-center gap-1 font-semibold text-green-700 transition-colors hover:text-green-800 hover:underline"
                      >
                        Sign up
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}