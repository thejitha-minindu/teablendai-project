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

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    /* ----------- ADDED ROLE STATE ----------- */
    const [role, setRole] = useState("buyer");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match!");
            return;
        }

        setIsLoading(true);

        try {
            const nameParts = fullName.trim().split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";
            const userName = email.split("@")[0] + Math.floor(Math.random() * 1000);

            const payload = {
                email: email,
                password: password,
                first_name: firstName,
                last_name: lastName,
                user_name: userName,
                phone_num: "Not Provided",
                default_role: role
            };

            await apiClient.post("/auth/register", payload);

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

            {/* LEFT IMAGE SECTION */}
            <div className="lg:w-1/2 w-full relative min-h-[50vh] lg:min-h-screen">
                <div className="absolute inset-0">
                    <Image
                        src="/login-image.webp"
                        alt="Tea Blending Process Background"
                        fill
                        className="object-cover object-center"
                        priority
                    />
                </div>

                <div className="absolute top-6 left-6 z-20">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ChevronLeft className="w-4 h-4 text-white" />
                        <div className="relative h-12 w-32">
                            <Image src="/tea-blend-logo.svg" alt="Tea Blend AI Logo" fill className="object-contain" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* RIGHT FORM SECTION */}
            <div className="lg:w-1/2 w-full flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md">

                    <Card className="border-0 shadow-2xl bg-white/95">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold">
                                Create Account
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Fill in your details to get started
                            </p>
                        </CardHeader>

                        <CardContent>

                            {errorMsg && (
                                <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border rounded-lg text-center">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* FULL NAME */}
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="pl-12 h-12 rounded-full"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="pl-12 h-12 rounded-full"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create password"
                                            className="pl-12 pr-12 h-12 rounded-full"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                        >
                                            {showPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                </div>

                                {/* CONFIRM PASSWORD */}
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="pl-12 pr-12 h-12 rounded-full"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2"
                                        >
                                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                                        </button>
                                    </div>
                                </div>

                                {/* ROLE SELECTION (ADDED) */}
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Register As</Label>

                                    <div className="flex gap-6 pt-2">

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="buyer"
                                                checked={role === "buyer"}
                                                onChange={(e) => setRole(e.target.value)}
                                            />
                                            Buyer
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="seller"
                                                checked={role === "seller"}
                                                onChange={(e) => setRole(e.target.value)}
                                            />
                                            Seller
                                        </label>

                                    </div>
                                </div>

                                {/* TERMS */}
                                <div className="flex items-start space-x-3">
                                    <Checkbox
                                        checked={agreeTerms}
                                        onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                                    />
                                    <Label className="text-sm">
                                        I agree to Terms and Privacy Policy
                                    </Label>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-full bg-green-600 text-white"
                                    disabled={isLoading || !agreeTerms}
                                >
                                    {isLoading ? "Creating Account..." : "Create Account"}
                                </Button>
                            </form>

                            <div className="relative my-8">
                                <Separator />
                                <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-sm">
                                    Already have an account?
                                </span>
                            </div>

                            <Button asChild variant="outline" className="w-full h-12 rounded-full">
                                <Link href="/auth/login">
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