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
    User,
    ChevronLeft,
    ArrowRight,
    Sparkles,
    Brain,
    Shield,
    Zap,
    Globe,
    CheckCircle,
    Users,
    Leaf,
    UserPlus,
    KeyRound,
    TrendingUp,
    ShoppingBag
} from "lucide-react";

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [role, setRole] = useState<'seller' | 'buyer'>('buyer');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate signup process
        setTimeout(() => setIsLoading(false), 2000);
    };

    return (
        <div className="max-h-screen w-full bg-gradient-to-br from-gray-50 to-green-50 flex flex-col lg:flex-row">
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

            {/* Right Section - Signup Form */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-4 lg:p-8 h-full overflow-auto">
                <div className="w-full max-w-md max-h-[95vh] h-full flex flex-col justify-center">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-6">
                        <div className="relative h-12 w-32">
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
                            <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900">
                                Create Account
                            </CardTitle>
                            <p className="text-xs text-gray-600">
                                Fill in your details to get started
                            </p>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Full Name Field */}
                                <div className="space-y-1">
                                    <Label htmlFor="fullName" className="text-gray-700">
                                        Full Name
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            className="pl-12 h-10 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-1">
                                    <Label className="text-gray-700">
                                        Default Role
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                id="buyer"
                                                name="role"
                                                value="buyer"
                                                checked={role === 'buyer'}
                                                onChange={() => setRole('buyer')}
                                                className="w-4 h-4 cursor-pointer accent-green-500"
                                            />
                                            <Label htmlFor="buyer" className="cursor-pointer text-xs font-medium">
                                                Buyer
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                id="seller"
                                                name="role"
                                                value="seller"
                                                checked={role === 'seller'}
                                                onChange={() => setRole('seller')}
                                                className="w-4 h-4 cursor-pointer accent-green-500"
                                            />
                                            <Label htmlFor="seller" className="cursor-pointer text-xs font-medium">
                                                Seller
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-gray-700">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-12 h-10 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-1">
                                    <Label htmlFor="password" className="text-gray-700">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            className="pl-12 pr-12 h-10 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
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
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <KeyRound className="w-3 h-3" />
                                        Use 8+ characters with letters, numbers & symbols
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-1">
                                    <Label htmlFor="confirmPassword" className="text-gray-700">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            className="pl-12 pr-12 h-10 rounded-full border-2 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="terms"
                                            checked={agreeTerms}
                                            onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <Label htmlFor="terms" className="text-xs text-gray-700 cursor-pointer">
                                            I agree to the{" "}
                                            <Link href="/terms" className="text-green-600 hover:underline">
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <Link href="/privacy" className="text-green-600 hover:underline">
                                                Privacy Policy
                                            </Link>
                                        </Label>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-300 group"
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
                            <div className="relative my-6">
                                <Separator className="my-4" />
                                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-gray-500">
                                    Already have an account?
                                </span>
                            </div>

                            {/* Login Button */}
                            <Button
                                asChild
                                variant="outline"
                                className="w-full h-10 rounded-full border-2 hover:bg-gray-50"
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