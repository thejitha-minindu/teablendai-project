"use client"; // Tells Next.js this component runs in the browser, not on the server

// --- Imports ---
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, User, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormLayout } from "@/components/auth/AuthFormLayout";
import { apiClient } from "@/lib/apiClient"; // Tool used to talk to our backend API

// --- Types ---
// This defines the exact structure of the data we expect the user to type in.
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

// Default empty values for the form when it first loads
const initialFormState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export function BuyerRegisterForm() {
  // --- Next.js Hooks ---
  const router = useRouter(); // Helps navigate between pages
  const searchParams = useSearchParams(); // Helps read URL variables like ?redirect=/dashboard

  // --- React State ---
  // Store what the user types into the form
  const [formData, setFormData] = useState<FormState>(initialFormState);
  
  // UI toggles
  const [showPassword, setShowPassword] = useState(false); // Toggle to show password text
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false); // Make sure they checked the Terms box
  
  // Status states
  const [isLoading, setIsLoading] = useState(false); // Are we waiting for the backend to reply?
  const [errorMsg, setErrorMsg] = useState(""); // Stores error messages (e.g., "Passwords don't match")

  // Where to send the user after a successful login (passed via URL)
  const redirectPath = searchParams.get("redirect");
  const redirectSuffix =
    redirectPath && redirectPath.startsWith("/")
      ? `&redirect=${encodeURIComponent(redirectPath)}`
      : "";

  // --- Handlers ---

  // This function updates the `formData` state whenever the user types into an input field.
  // We use currying `(field) => (event) =>` so we can easily attach it to inputs: `onChange={handleChange("email")}`
  const handleChange =
    (field: keyof FormState) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      
      // If the user starts typing again, clear any old error messages
      if (errorMsg) {
        setErrorMsg("");
      }
    };

  // Checks the form before we send anything to the backend
  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return false;
    }

    if (formData.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return false;
    }

    return true; // Form looks good!
  };

  // Called when the user clicks the "Create Buyer Account" submit button
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevents the browser from doing a full page refresh
    setErrorMsg(""); // Clear old errors

    // Run our checks (like password matching)
    if (!validateForm()) {
      return; // Stop right here if the checks fail
    }

    setIsLoading(true); // Show the loading state on the button

    try {
      // Create a temporary username based on their email (e.g., john@example.com -> john123)
      // The user can change this later in their profile
      const userName = `${formData.email.split("@")[0]}${Math.floor(
        Math.random() * 1000
      )}`;

      // Send the data to the backend API to create the user in the database
      // Data flows from: User typing -> formData state -> this API call -> Backend server -> Database
      await apiClient.post("/auth/register", {
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        user_name: userName,
        phone_num: formData.phoneNumber.trim(),
        shipping_address: formData.address.trim(),
        default_role: "buyer", // Force the role to be 'buyer'
      });

      // If we got here, registration was successful!
      // Send them to the login page and show a success message
      router.push(`/auth/buyer/login?message=registration-success${redirectSuffix}`);
    } catch (error: any) {
      console.error("Buyer signup error:", error);
      // Display the exact error from the backend (like "Email already exists"), 
      // or a generic fallback error.
      setErrorMsg(
        error.response?.data?.detail ||
          "Failed to create your buyer account. Please try again."
      );
    } finally {
      setIsLoading(false); // Hide the loading state, whether we succeeded or failed
    }
  };

  // --- UI Render ---
  return (
    <AuthFormLayout>
      <Card className="overflow-hidden border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="border-b border-green-100 bg-gradient-to-r from-white to-green-50/80 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg">
            <UserRound className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Create Buyer Account
          </CardTitle>
          <p className="mx-auto max-w-md text-sm leading-6 text-gray-600">
            Set up your buyer profile to explore auctions, manage orders, and
            purchase with confidence on TeaBlend AI.
          </p>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {/* Show the red error box if something went wrong */}
          {errorMsg && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                  Personal Details
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Use the details associated with your buyer account.
                </p>
              </div>

              {/* Grid layout for fields side-by-side on larger screens */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="first-name"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange("firstName")} // Connect input to React state
                      placeholder="Enter first name"
                      className="h-12 rounded-2xl border-gray-200 pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="last-name"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange("lastName")} // Connect input to React state
                      placeholder="Enter last name"
                      className="h-12 rounded-2xl border-gray-200 pl-12"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")} // Connect input to React state
                    placeholder="you@example.com"
                    className="h-12 rounded-2xl border-gray-200 pl-12"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="phone-number"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange("phoneNumber")} // Connect input to React state
                      placeholder="+94 77 123 4567"
                      className="h-12 rounded-2xl border-gray-200 pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={handleChange("address")} // Connect input to React state
                      placeholder="Enter your delivery or billing address"
                      className="min-h-[108px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-green-100 pt-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                  Security
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a strong password for your buyer account.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"} // Switches between text/dots
                      value={formData.password}
                      onChange={handleChange("password")} // Connect input to React state
                      placeholder="At least 8 characters"
                      className="h-12 rounded-2xl border-gray-200 pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)} // Toggles visibility
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"} // Switches between text/dots
                      value={formData.confirmPassword}
                      onChange={handleChange("confirmPassword")} // Connect input to React state
                      placeholder="Repeat your password"
                      className="h-12 rounded-2xl border-gray-200 pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)} // Toggles visibility
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)} // Update agree state
                  id="buyer-terms"
                />
                <Label htmlFor="buyer-terms" className="text-sm leading-6 text-gray-700">
                  I agree to the{" "}
                  <Link href="/terms" className="font-semibold text-green-700 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold text-green-700 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !agreeTerms} // Don't let them click if it's loading or they haven't agreed
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-base font-semibold text-white shadow-lg transition hover:from-green-700 hover:to-emerald-600"
            >
              {isLoading ? "Creating Buyer Account..." : "Create Buyer Account"}
            </Button>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
              <p className="text-sm text-gray-600">
                Already have a buyer account?{" "}
                {/* Send them to the login page, remembering where they were trying to go if a redirect is present */}
                <Link
                  href={`/auth/buyer/login${redirectPath && redirectPath.startsWith("/") ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                  className="font-semibold text-green-700 transition hover:text-green-800 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
