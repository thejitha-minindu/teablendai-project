"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, User, ChevronLeft, ArrowRight, KeyRound } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function Signup() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        // 1. Validate Passwords match
        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match!");
            return;
        }

        setIsLoading(true);

        try {
            // 2. Format data for Backend Schema
            const nameParts = fullName.trim().split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";
            const userName = email.split("@")[0] + Math.floor(Math.random() * 1000); // Generate unique username

            const payload = {
                email: email,
                password: password,
                first_name: firstName,
                last_name: lastName,
                user_name: userName,
                phone_num: "Not Provided", // Default since UI doesn't collect it
                default_role: "buyer"
            };

            // 3. Send Registration Request (Sending as JSON)
            await apiClient.post("/auth/register", payload);

            // 4. Redirect to login page on success
            alert("Account created successfully! Please log in.");
            router.push("/auth/login");

        } catch (error: any) {
            console.error("Signup error:", error);
            setErrorMsg(error.response?.data?.detail || "Failed to create account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-green-50 flex flex-col lg:flex-row">
            {/* Left Section - Full Screen Background Image */}
            <div className="lg:w-1/2 w-full relative min-h-[50vh] lg:min-h-screen">
                <div className="absolute inset-0">
                    <Image
                        src="/login-image.webp"
                        alt="Tea Blending Process Background"
                        fill
                        className="object-cover object-center"
                        priority
                        sizes="50vw"
                        quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-transparent"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
                </div>
                
                <div className="absolute top-6 left-6 z-20">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ChevronLeft className="w-4 h-4 text-white/80 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
                        <div className="relative h-12 w-32">
                            <Image src="/tea-blend-logo.svg" alt="Tea Blend AI Logo" fill className="object-contain" />
                        </div>
                    </Link>
                </div>

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Right Section - Signup Form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="relative h-14 w-40">
                            <Image src="/tea-blend-logo.svg" alt="Tea Blend AI Logo" fill className="object-contain" />
                        </div>
                    </div>

                    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                        <CardHeader className="space-y-2 text-center">
                            <CardTitle className="text-3xl lg:text-4xl font-bold text-gray-900">
                                Create Account
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Fill in your details to get started
                            </p>
                        </CardHeader>

                        <CardContent>
                            {/* Error Message Display */}
                            {errorMsg && (
                                <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="pl-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="pl-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a strong password"
                                            className="pl-12 pr-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <KeyRound className="w-3 h-3" />
                                        Use 8+ characters with letters, numbers & symbols
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your password"
                                            className="pl-12 pr-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-start space-x-3">
                                        <Checkbox 
                                            id="terms" 
                                            checked={agreeTerms}
                                            onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <Label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                                            I agree to the{" "}
                                            <Link href="/terms" className="text-green-600 hover:underline">Terms of Service</Link>{" "}
                                            and{" "}
                                            <Link href="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
                                        </Label>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                                    disabled={isLoading || !agreeTerms}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating Account...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            Create Account
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-8">
                                <Separator className="my-6" />
                                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-sm text-gray-500">
                                    Already have an account?
                                </span>
                            </div>

                            {/* Login Button */}
                            <Button
                                asChild
                                variant="outline"
                                className="w-full h-12 rounded-full border-2 hover:bg-gray-50"
                            >
                                <Link href="/auth/login" className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign in to existing account
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}