"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';

import { 
  Brain, 
  TrendingUp, 
  Palette, 
  Shield, 
  Globe, 
  LineChart,
  ArrowRight,
  PlayCircle,
  MessageCircle,
  Leaf,
  Sparkles,
  Users,
  Award,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  Clock,
  Lock,
  RefreshCw,
  Coffee,
  Package,
  Star,
  Cloud,
  Database,
  ChevronLeft,
  LineChart as ChartLine
} from "lucide-react";

export default function HomePage() {
    const router = useRouter();
    return (
        <main className="overflow-hidden">
            {/* ================= HERO SECTION ================= */}
            <section className="relative flex min-h-screen items-center justify-center bg-linear-to-br from-[#f5f5f5] via-white to-[#e8f5e9] px-4 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2e7d32]/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#4caf50]/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 py-20 z-10">
                    {/* Left: Text Content */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="px-4 py-1 border-green-300 text-green-700 flex items-center gap-1">
                                <Brain className="w-3 h-3" />
                                AI-Powered
                            </Badge>
                        </div>
                        
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                            Welcome to <br />
                            <span className="bg-linear-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                                Tea BlendAI
                            </span>
                        </h1>
                        
                        <p className="text-xl text-gray-700 max-w-lg leading-relaxed">
                            Revolutionizing the tea industry with artificial intelligence. 
                            Create perfect blends, analyze market trends, and make data-driven 
                            decisions with our advanced AI platform.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button asChild className="bg-linear-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white h-12 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group">
                                <Link href="/auth/login" className="flex items-center gap-2">
                                    Get Started 
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-12 px-8 text-lg rounded-full border-2">
                                <Link href="#features" className="flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5" />
                                    More Info
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right: Image */}
                    <div className="relative flex items-center justify-center">
                        <div className="relative w-full max-w-2xl">
                            <div className="absolute inset-0 bg-linear-to-r from-green-400/20 to-emerald-400/20 rounded-3xl blur-3xl"></div>
                            <div className="relative bg-linear-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-2xl">
                                <Image
                                    src="/tea-blend-background-image.svg"
                                    alt="Tea Blend AI Dashboard"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto object-contain drop-shadow-xl animate-float rounded-lg"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES SECTION ================= */}
            <section id="features" className="py-24 bg-linear-to-b from-white to-gray-50 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-10 px-4 py-1 border-green-300 text-green-700 flex items-center gap-1 w-fit mx-auto">
                            <Sparkles className="w-3 h-3" />
                            Features
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-10">
                            Powerful AI Tools for <span className="text-green-700">Tea Industry</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                            Our platform offers comprehensive solutions for tea producers, exporters, and enthusiasts
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: "AI Tea Blend Creator",
                                description: "Generate perfect tea blends using machine learning algorithms",
                                icon: <Brain className="w-10 h-10 text-green-600" />,
                                color: "white",
                                path: "/export-analytics"
                            },
                            {
                                title: "Market Analysis",
                                description: "Real-time insights on tea market trends and pricing",
                                icon: <TrendingUp className="w-10 h-10 text-green-600" />,
                                color: "white",
                                path: "/market-analysis"
                            },
                            {
                                title: "Export Analytics",
                                description: "Data-driven insights for international tea trade",
                                icon: <Globe className="w-10 h-10 text-green-600" />,
                                color: "white",
                                path: "/export-analytics"
                            }
                        ].map((feature, index) => (
                            <Card key={index} className={`group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-200 hover:scale-[1.02] bg-linear-to-br ${feature.color}`}>
                                <CardHeader>
                                    <div className="mb-4 p-3 bg-white rounded-xl w-fit shadow-sm">
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 mb-4">{feature.description}</p>
                                    <Button variant="ghost" className="text-green-700 hover:text-green-800 p-0 h-auto group" onClick={() => router.push(feature.path)}>
                                        Learn more
                                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="bg-linear-to-b from-gray-900 to-black text-white px-6 md:px-16 lg:px-24 py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-linear-to-r from-green-600 to-emerald-500 rounded-lg flex items-center justify-center overflow-hidden">
                                    <Image
                                        src="/tea-blend-logo.svg"
                                        alt="Tea Blend AI Logo"
                                        width={28}
                                        height={28}
                                        className="w-7 h-7 object-contain"
                                    />
                                </div>
                                <span className="text-xl font-bold">TeaBlendAI</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Designed for tea lovers who value quality, innovation, and sustainability.
                                Join our tea community and revolutionize your tea experience with AI.
                            </p>
                            <div className='flex items-center gap-3'>
                                <Button variant="ghost" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700 hover:text-white" asChild>
                                    <Link href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                                        <Instagram className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700 hover:text-white" asChild>
                                    <Link href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                                        <Facebook className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700 hover:text-white" asChild>
                                    <Link href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                                        <Twitter className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full bg-gray-800 hover:bg-gray-700 hover:text-white" asChild>
                                    <Link href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                                        <Linkedin className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-green-400" />
                                COMPANY
                            </h3>
                            <ul className="space-y-3">
                                {['Home', 'About', 'Features', 'Pricing', 'Contact'].map((item) => (
                                    <li key={item}>
                                        <Link href="#" className="text-gray-400 hover:text-white transition-all text-sm flex items-center gap-2 hover:translate-x-1">
                                            <ChevronRight className="w-3 h-3 text-green-500 opacity-0 group-hover:opacity-100" />
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <Package className="w-4 h-4 text-green-400" />
                                SERVICES
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    'AI Tea Blend Creator',
                                    'Tea Taste Profiler',
                                    'Custom Blend Analyzer',
                                    'Regional Tea Explorer',
                                    'Wholesale Solutions',
                                    'Tea Expert Chatbot'
                                ].map((service) => (
                                    <li key={service}>
                                        <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                            <ChevronRight className="w-3 h-3 text-green-500 opacity-0 group-hover:opacity-100" />
                                            {service}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-400" />
                                    CONTACT
                                </h3>
                                <address className="not-italic text-gray-400 text-sm space-y-3">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <p>No 246/2, Galle Road,<br />Colombo 07.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-green-500" />
                                        <Link href="mailto:teablendai@gmail.com" className="hover:text-white">
                                            teablendai@gmail.com
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-green-500" />
                                        <Link href="tel:011-1167432" className="hover:text-white">
                                            011-1167432
                                        </Link>
                                    </div>
                                </address>
                            </div>
                            
                            
                        </div>
                    </div>

                    <Separator className="my-8 bg-gray-800" />

                    <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} TEABLENDAI. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-gray-400">
                            {[
                                { label: 'Privacy Policy', path: '/privacy' },
                                { label: 'Terms of Service', path: '/terms' },
                                { label: 'Cookie Policy', path: '/cookie-policy' }
                            ].map((item) => (
                                <Link key={item.label} href={item.path} className="hover:text-white transition-colors hover:underline underline-offset-2">
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
