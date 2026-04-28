"use client"; // Tells Next.js this component runs in the browser (client-side)

// --- Imports ---
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
// Icons used in the UI
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
// Reusable UI components (like buttons, cards, inputs)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// Authentication utilities (getting tokens, user roles, etc.)
import { getAuthClaims, getHomePathByRole, setStoredAuthToken, type UserRole } from "@/lib/auth";
// The API client used to make requests to the backend
import { apiClient } from "@/lib/apiClient";
import authService from "@/services/authService";
import { AuthFormLayout } from "@/components/auth/AuthFormLayout";

// The Google Client ID used for Google Sign-In
const GOOGLE_CLIENT_ID = "66190572875-bnen1rjau39fma3pd86c1d6udqm22dri.apps.googleusercontent.com";

// Properties accepted by this component. 
// "role" can be either 'buyer' or 'seller', determining which form to show.
type RoleLoginFormProps = {
  role?: UserRole;
};

// Custom text for the form based on whether the user is a buyer or seller.
const ROLE_COPY: Record<UserRole, { title: string; subtitle: string; registerHref: string }> = {
  buyer: {
    title: "Buyer Sign In",
    subtitle: "Access auctions, orders, and your TeaBlend AI dashboard.",
    registerHref: "/auth/buyer/register",
  },
  seller: {
    title: "Seller Sign In",
    subtitle: "Manage auctions, listings, and your TeaBlend AI seller workspace.",
    registerHref: "/auth/seller/register",
  },
};

// Helper function to safely redirect users after login
// It ensures we only redirect to safe local routes (starting with "/") to prevent external redirection attacks
function getSafeRedirectPath(redirectPath: string | null) {
  if (!redirectPath || !redirectPath.startsWith("/")) {
    return null;
  }
  return redirectPath;
}

export function RoleLoginForm({ role }: RoleLoginFormProps) {
  // --- Next.js Hooks ---
  const router = useRouter(); // Used for changing pages programmatically
  const searchParams = useSearchParams(); // Used to read URL parameters (like ?redirect=...)

  // --- React State Management ---
  // useState hooks manage variables that change over time and update the UI when they do
  const [showPassword, setShowPassword] = useState(false); // Toggles password visibility (text vs dots)
  const [isLoading, setIsLoading] = useState(false); // True when waiting for an API response
  const [errorMsg, setErrorMsg] = useState(""); // Stores error messages to show the user
  const [successMsg, setSuccessMsg] = useState(""); // Stores success messages
  const [email, setEmail] = useState(""); // The user's typed email
  const [password, setPassword] = useState(""); // The user's typed password

  // Determine where to send the user after login
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));
  
  // Pick the right titles and links based on the user's role
  const content = role ? ROLE_COPY[role] : null;
  const title = content?.title ?? "Sign In";
  const subtitle = content?.subtitle ?? "Welcome back to TeaBlend AI!";
  const registerHref = content?.registerHref ?? "/auth/signup";
  const forgotPasswordHref = role ? `/auth/forgot-password?role=${role}` : "/auth/forgot-password";

  // --- Core Routing & Role Logic ---
  // This function decides where the user goes after they log in successfully
  const routeApprovedUser = async () => {
    try {
      // 1. Fetch the user's details from the backend
      const currentUser = await authService.getCurrentUser();
      const verificationStatus = currentUser.verification_status || "PENDING";

      // 2. Check their approval status and redirect accordingly
      if (verificationStatus === "PENDING") {
        router.push("/auth/pending"); // Still waiting for admin approval
        return;
      }

      if (verificationStatus === "REJECTED") {
        router.push("/auth/rejected"); // Admin rejected the account
        return;
      }

      if (verificationStatus === "APPROVED") {
        // Successfully verified! Redirect to the page they requested, or their default dashboard
        router.push(redirectPath || getHomePathByRole(currentUser.default_role));
      }
    } catch (fetchError) {
      // Fallback: If fetching fails, try reading the status from the JWT token stored locally
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

  // --- Effects ---
  // useEffect runs when the component loads or when dependencies change
  // Here, we check the URL for success messages (like coming from a password reset or registration)
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password-reset-success") {
      setSuccessMsg("Password reset successful! You can now log in with your new password.");
    } else if (message === "registration-success") {
      setSuccessMsg("Account created successfully. Please sign in to continue.");
    }
  }, [searchParams]);

  // --- Standard Login Flow ---
  // Called when the user clicks "Sign In" with email and password
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing when the form submits
    setIsLoading(true); // Show a loading spinner
    setErrorMsg(""); // Clear old errors

    try {
      // Prepare the data to send to the backend
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      // Make the API call to log in
      const response = await apiClient.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Save the returned JWT token to local storage so the user stays logged in
      setStoredAuthToken(response.data.access_token);
      
      // Determine where the user goes next based on their role and verification status
      await routeApprovedUser();
    } catch (error: any) {
      console.error("Login failed:", error);
      // Show the error message from the backend, or a default message
      setErrorMsg(error.response?.data?.detail || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false); // Stop the loading spinner
    }
  };

  // --- Google Login Flow ---
  // Called when the user successfully signs in via the Google popup
  const handleGoogleLogin = async (credentialResponse: any) => {
    setErrorMsg("");
    try {
      // Send the Google token to our backend to verify and log the user in
      const response = await apiClient.post("/auth/google", {
        token: credentialResponse.credential,
      });

      // Save the JWT token to local storage
      setStoredAuthToken(response.data.access_token);
      
      // Navigate to the correct page
      await routeApprovedUser();
    } catch (error) {
      console.error("Google login failed:", error);
      setErrorMsg("Google authentication failed. Please try again.");
    }
  };

  // --- UI Render ---
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthFormLayout>
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl lg:text-4xl font-bold text-gray-900">
              {title}
            </CardTitle>
            <CardDescription className="text-lg">{subtitle}</CardDescription>
            <p className="text-sm text-gray-600">
              Please sign in to continue your tea blending journey
            </p>
          </CardHeader>

          <CardContent>
            {/* Display success messages (like account created successfully) */}
            {successMsg && (
              <div className="mb-6 p-3 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            {/* Display error messages (like invalid password) */}
            {errorMsg && (
              <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-6">
              {/* Google Sign-In Button */}
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

              {/* Visual Separator */}
              <div className="relative">
                <Separator className="my-6" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-sm text-gray-500">
                  or sign in with email
                </span>
              </div>

              {/* Standard Email & Password Login Form */}
              <form onSubmit={handleStandardLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} // Update state when user types
                      placeholder="you@example.com"
                      className="pl-12 h-12 rounded-full border-2 focus:border-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-gray-700">
                      Password
                    </Label>
                    <Link
                      href={forgotPasswordHref}
                      className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"} // Switches between plain text and dots
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} // Update state when user types
                      placeholder="Enter your password"
                      className="pl-12 pr-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)} // Toggles the visibility state
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                  disabled={isLoading} // Disables the button while loading
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-600">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-green-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-green-600 hover:underline">
                Privacy Policy
              </Link>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href={registerHref}
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                >
                  Sign up for free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </AuthFormLayout>
    </GoogleOAuthProvider>
  );
}
