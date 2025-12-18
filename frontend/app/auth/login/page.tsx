"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ChevronLeft, 
  ArrowRight,
  Sparkles,
  Brain,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  TrendingUp,
  Users,
  Leaf
} from "lucide-react";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate login process
        setTimeout(() => setIsLoading(false), 2000);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-green-50 flex flex-col lg:flex-row">
            {/* Left Section - Full Screen Background Image */}
            <div className="lg:w-1/2 w-full relative min-h-[50vh] lg:min-h-screen">
                {/* Full Screen Background Image */}
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
                    
                    {/* Dark Overlay for Better Text Contrast */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-transparent"></div>
                    
                    {/* Subtle Pattern Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
                </div>
                
                {/* Logo */}
                <div className="absolute top-6 left-6 z-20">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ChevronLeft className="w-4 h-4 text-white/80 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
                        <div className="relative h-12 w-32">
                            <Image
                                src="/tea-blend-logo.svg"
                                alt="Tea Blend AI Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </Link>
                </div>
                {/* Background Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="relative h-14 w-40">
                            <Image
                                src="/tea-blend-logo.svg"
                                alt="Tea Blend AI Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                        <CardHeader className="space-y-2 text-center">
                            <CardTitle className="text-3xl lg:text-4xl font-bold text-gray-900">
                                Sign In
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Welcome back to TeaBlend AI!
                            </CardDescription>
                            <p className="text-sm text-gray-600">
                                Please sign in to continue your tea blending journey
                            </p>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Google Sign In */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 rounded-full border-2 hover:bg-gray-50 transition-all duration-200"
                                    onClick={() => window.location.href = "https://accounts.google.com"}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Image
                                            src="/google-logo.png"
                                            alt="Google"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5"
                                        />
                                        <span className="text-gray-700 font-medium">
                                            Continue with Google
                                        </span>
                                    </div>
                                </Button>

                                <div className="relative">
                                    <Separator className="my-6" />
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-sm text-gray-500">
                                        or sign in with email
                                    </span>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-gray-700">
                                            Password
                                        </Label>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-sm text-green-600 hover:text-green-700 hover:underline transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="pl-12 pr-12 h-12 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
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

                                {/* Remember Me */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember" />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm text-gray-700 cursor-pointer"
                                    >
                                        Remember me for 30 days
                                    </Label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                                    disabled={isLoading}
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
                                        href="/auth/signup"
                                        className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                                    >
                                        Sign up for free
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}