"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Cookie,
  Shield,
  Settings,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Mail,
  Trash2,
} from "lucide-react";

const sections = [
  {
    icon: <Cookie className="w-5 h-5" />,
    number: "1",
    title: "What Are Cookies?",
    content: (
      <p>
        Cookies are small text files stored on your device when you visit TeaBlend AI. They help us remember your preferences and improve your experience on our platform.
      </p>
    ),
  },
  {
    icon: <Shield className="w-5 h-5" />,
    number: "2",
    title: "Types of Cookies We Use",
    content: (
      <>
        <h3 className="font-semibold text-gray-800 mb-1">a. Essential Cookies</h3>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Session management</li>
          <li>Authentication tokens</li>
          <li>Security purposes</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mb-1">b. Functional Cookies</h3>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Remember your login information</li>
          <li>Store your preferences</li>
          <li>Maintain language selection</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mb-1">c. Analytical Cookies</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Track page visits and user behavior</li>
          <li>Measure platform performance</li>
          <li>Improve user experience</li>
        </ul>
      </>
    ),
  },
  {
    icon: <Settings className="w-5 h-5" />,
    number: "3",
    title: "Purpose of Cookies",
    content: (
      <>
        <p>We use cookies to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Keep you logged in during your session</li>
          <li>Remember your username and preferences</li>
          <li>Provide personalized content recommendations</li>
          <li>Analyze how you use our platform</li>
          <li>Prevent fraudulent activity</li>
          <li>Improve website functionality and performance</li>
        </ul>
      </>
    ),
  },
  {
    icon: <Users className="w-5 h-5" />,
    number: "4",
    title: "Third-Party Cookies",
    content: (
      <>
        <p>We may allow third parties to place cookies on our platform for:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Analytics (Google Analytics)</li>
          <li>Payment processing</li>
          <li>Social media integration</li>
          <li>Marketing and advertising</li>
        </ul>
        <p className="mt-2">These third parties have their own cookie policies.</p>
      </>
    ),
  },
  {
    icon: <Clock className="w-5 h-5" />,
    number: "5",
    title: "Cookie Expiration",
    content: (
      <>
        <h3 className="font-semibold text-gray-800 mb-1">Session Cookies</h3>
        <p className="mb-3">Automatically deleted when you close your browser.</p>

        <h3 className="font-semibold text-gray-800 mb-1">Persistent Cookies</h3>
        <p>Remain on your device for a specified period (typically 1 year) or until manually deleted.</p>
      </>
    ),
  },
  {
    icon: <AlertCircle className="w-5 h-5" />,
    number: "6",
    title: "Data Collected by Cookies",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Your IP address</li>
        <li>Browser type and version</li>
        <li>Device information</li>
        <li>Pages you visit</li>
        <li>Time spent on each page</li>
        <li>Links you click</li>
        <li>Referral source</li>
      </ul>
    ),
  },
  {
    icon: <Settings className="w-5 h-5" />,
    number: "7",
    title: "How to Manage Cookies",
    content: (
      <>
        <p className="font-semibold text-gray-800 mb-2">You can control cookies through your browser:</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
          <li><strong>Firefox:</strong> Preferences → Privacy → Cookies</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
          <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
        </ul>
        <p className="text-sm text-gray-600 mt-2"><strong>Note:</strong> Disabling essential cookies may affect platform functionality.</p>
      </>
    ),
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    number: "8",
    title: "Cookie Consent",
    content: (
      <p>
        When you first visit TeaBlend AI, you'll see a cookie consent banner. You can:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Accept all cookies</li>
          <li>Reject non-essential cookies</li>
          <li>Customize your preferences</li>
        </ul>
      </p>
    ),
  },
  {
    icon: <Info className="w-5 h-5" />,
    number: "9",
    title: "Do Not Track (DNT)",
    content: (
      <p>
        If you enable DNT in your browser, TeaBlend AI will respect this preference. However, some platform features may not work optimally without cookies.
      </p>
    ),
  },
  {
    icon: <Trash2 className="w-5 h-5" />,
    number: "10",
    title: "Deleting Cookies",
    content: (
      <>
        <p>To delete cookies from TeaBlend AI:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Clear your browser cache and cookies</li>
          <li>Log out of your account</li>
          <li>Adjust your browser settings to clear cookies on exit</li>
        </ul>
        <p className="text-sm text-gray-600 mt-2"><strong>Tip:</strong> You'll need to log in again after clearing cookies.</p>
      </>
    ),
  },
  {
    icon: <Shield className="w-5 h-5" />,
    number: "11",
    title: "Cookie Security",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>We use secure, encrypted cookies</li>
        <li>Authentication cookies are httpOnly and secure</li>
        <li>Sensitive data is never stored in cookies</li>
        <li>We comply with GDPR and cookie regulations</li>
      </ul>
    ),
  },
  {
    icon: <Mail className="w-5 h-5" />,
    number: "12",
    title: "Contact Us",
    content: (
      <p>
        For questions about our cookie policy:{" "}
        <a href="mailto:privacy@teablendai.com" className="text-green-600 hover:underline font-medium">
          privacy@teablendai.com
        </a>
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-gray-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <Link href="/" className="relative h-10 w-28">
            <Image src="/tea-blend-logo.svg" alt="TeaBlend AI" fill className="object-contain" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-green-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 shadow-xl mb-6">
            <Cookie className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Cookie Policy
          </h1>
          <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
            Understand how TeaBlend AI uses cookies to enhance your experience and protect your privacy.
          </p>
          <p className="mt-2 text-xs text-gray-400">Last updated: April 2026</p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="space-y-5">
          {sections.map((s) => (
            <div
              key={s.number}
              className="group rounded-2xl bg-white/90 backdrop-blur border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                {/* Number badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow">
                  {s.number}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">{s.icon}</span>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{s.title}</h2>
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {s.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Have questions about cookies or our policy?
          </p>
          <Link
            href="mailto:privacy@teablendai.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </Link>
        </div>
      </main>
    </div>
  );
}
