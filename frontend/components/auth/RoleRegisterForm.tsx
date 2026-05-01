"use client"; // Tells Next.js this component runs in the browser, not on the server

// --- Imports ---
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react"; // Icons for the form
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/apiClient"; // Tool used to talk to our backend API
import { AuthFormLayout } from "@/components/auth/AuthFormLayout";
import type { UserRole } from "@/lib/auth"; // Type definition for 'buyer' | 'seller'

// --- Types & Configurations ---

// This form can be used for both Buyers and Sellers.
// We pass the `role` as a property to know which version of the form to show.
type RoleRegisterFormProps = {
  role?: UserRole;
};

// Text configurations depending on which role we are registering
const ROLE_COPY: Record<UserRole, { title: string; subtitle: string; loginHref: string }> = {
  buyer: {
    title: "Create Buyer Account",
    subtitle: "Join TeaBlend AI to explore auctions, orders, and buyer insights.",
    loginHref: "/auth/buyer/login",
  },
  seller: {
    title: "Create Seller Account",
    subtitle: "Join TeaBlend AI to manage listings, auctions, and seller operations.",
    loginHref: "/auth/seller/login",
  },
};

export function RoleRegisterForm({ role }: RoleRegisterFormProps) {
  // --- Next.js Hooks ---
  const router = useRouter(); // Used for navigation after success
  const searchParams = useSearchParams(); // Used to read the URL (like ?redirect=...)

  // --- React State ---
  // useState stores data that changes while the user interacts with the page
  
  // UI Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Controls the "Loading..." state on the button
  const [agreeTerms, setAgreeTerms] = useState(false); // Makes sure the user agrees to terms
  
  // Form Data
  const [errorMsg, setErrorMsg] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // What role is the user signing up for? If a role was passed in, use that.
  // Otherwise, default to "buyer".
  const [selectedRole, setSelectedRole] = useState<UserRole>(role ?? "buyer");

  // Choose the correct text based on the role
  const content = role ? ROLE_COPY[role] : null;
  const title = content?.title ?? "Create Account";
  const subtitle = content?.subtitle ?? "Fill in your details to get started";
  const loginHref = content?.loginHref ?? "/auth/login";
  
  // Where to send the user after registration (passed in the URL)
  const redirectPath = searchParams.get("redirect");
  const redirectSuffix =
    redirectPath && redirectPath.startsWith("/")
      ? `&redirect=${encodeURIComponent(redirectPath)}`
      : "";

  // --- Handlers ---
  
  // Called when the user clicks the "Create Account" submit button
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing
    setErrorMsg(""); // Clear any old errors

    // 1. Basic Validation
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!");
      return; // Stop right here
    }

    setIsLoading(true); // Show the loading indicator

    try {
      // 2. Prepare Data
      // Split the full name into first name and last name
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";
      
      // Generate a default username using their email
      const userName = `${email.split("@")[0]}${Math.floor(Math.random() * 1000)}`;

      // 3. API Call
      // Send the data to the backend to create the user
      await apiClient.post("/auth/register", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        user_name: userName,
        phone_num: "Not Provided", // A default value, they can update this later in profile
        default_role: selectedRole, // Either 'buyer' or 'seller'
      });

      // 4. Success Navigation
      // Send them to the login page with a success message
      router.push(`${loginHref}?message=registration-success${redirectSuffix}`);
    } catch (error: any) {
      console.error("Signup error:", error);
      // Show the backend error if there is one (like "Email already in use")
      setErrorMsg(
        error.response?.data?.detail ||
          "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false); // Hide the loading indicator
    }
  };

  // --- UI Render ---
  return (
    <AuthFormLayout>
      <Card className="border-0 shadow-2xl bg-white/95">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </CardHeader>

        <CardContent>
          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)} // Connect input to React state
                  placeholder="Enter your full name"
                  className="pl-12 h-12 rounded-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // Connect input to React state
                  placeholder="you@example.com"
                  className="pl-12 h-12 rounded-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"} // Toggles between text and dots
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Connect input to React state
                  placeholder="Create password"
                  className="pl-12 pr-12 h-12 rounded-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} // Toggle visibility button
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"} // Toggles between text and dots
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} // Connect input to React state
                  placeholder="Confirm password"
                  className="pl-12 pr-12 h-12 rounded-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle visibility button
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Role Selection (Only shown if a specific role wasn't passed as a prop) */}
            {!role && (
              <div className="space-y-2">
                <Label className="text-gray-700">Register As</Label>
                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="buyer"
                      checked={selectedRole === "buyer"}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)} // Connect radio to state
                    />
                    Buyer
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="seller"
                      checked={selectedRole === "seller"}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)} // Connect radio to state
                    />
                    Seller
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)} // Connect checkbox to state
              />
              <Label className="text-sm">
                I agree to Terms and Privacy Policy
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-green-600 text-white"
              disabled={isLoading || !agreeTerms} // Prevent submission if loading or terms aren't agreed
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Visual Separator */}
          <div className="relative my-8">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-sm">
              Already have an account?
            </span>
          </div>

          <Button asChild variant="outline" className="w-full h-12 rounded-full">
            <Link href={loginHref}>Sign in to existing account</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
