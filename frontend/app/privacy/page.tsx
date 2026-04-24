"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  BarChart3,
  Monitor,
  Mail,
  Lock,
  Share2,
  Cookie,
  UserCheck,
  Database,
  Globe,
  Baby,
  RefreshCw,
  Phone,
} from "lucide-react";

const sections = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    number: "1",
    title: "Introduction",
    content: (
      <p>
        Your privacy is important to us. This Privacy Policy explains how TeaBlend AI collects, uses, and protects your information.
      </p>
    ),
  },
  {
    icon: <User className="w-5 h-5" />,
    number: "2",
    title: "Information We Collect",
    content: (
      <>
        <h3 className="font-semibold text-gray-800 mb-1">a. Personal Information</h3>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Name</li>
          <li>Email address</li>
          <li>Password (encrypted)</li>
          <li>Account role (buyer / seller / admin)</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mb-1">b. Usage Data</h3>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Login activity</li>
          <li>Pages visited</li>
          <li>Feature usage (AI tools, analytics, etc.)</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mb-1">c. Technical Data</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>IP address</li>
          <li>Browser type</li>
          <li>Device information</li>
        </ul>
      </>
    ),
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    number: "3",
    title: "How We Use Your Information",
    content: (
      <>
        <p>We use your data to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Create and manage user accounts</li>
          <li>Send OTP verification emails</li>
          <li>Provide AI-based recommendations</li>
          <li>Improve system performance</li>
          <li>Ensure platform security</li>
        </ul>
      </>
    ),
  },
  {
    icon: <Mail className="w-5 h-5" />,
    number: "4",
    title: "Email & OTP Communication",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>OTP codes are sent to your registered email</li>
        <li>Emails are used only for authentication and important notifications</li>
        <li>We do <strong>NOT</strong> send spam</li>
      </ul>
    ),
  },
  {
    icon: <Lock className="w-5 h-5" />,
    number: "5",
    title: "Data Storage & Security",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Passwords are securely encrypted</li>
        <li>We use secure servers and APIs</li>
        <li>Access to data is restricted to authorized personnel</li>
      </ul>
    ),
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    number: "6",
    title: "Data Sharing",
    content: (
      <>
        <p>We do <strong>NOT</strong>:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Sell your personal data</li>
          <li>Share data with third parties without consent</li>
        </ul>
        <p className="mt-2">We <strong>MAY</strong> share data if required by law.</p>
      </>
    ),
  },
  {
    icon: <Cookie className="w-5 h-5" />,
    number: "7",
    title: "Cookies",
    content: (
      <>
        <p>We use cookies to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Maintain login sessions</li>
          <li>Improve user experience</li>
          <li>Analyze platform usage</li>
        </ul>
        <p className="mt-2">You can disable cookies in your browser settings.</p>
      </>
    ),
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    number: "8",
    title: "User Rights",
    content: (
      <>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Access your data</li>
          <li>Update your profile</li>
          <li>Request account deletion</li>
        </ul>
      </>
    ),
  },
  {
    icon: <Database className="w-5 h-5" />,
    number: "9",
    title: "Data Retention",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>We keep your data while your account is active</li>
        <li>Deleted accounts may have data removed permanently</li>
      </ul>
    ),
  },
  {
    icon: <Globe className="w-5 h-5" />,
    number: "10",
    title: "Third-Party Services",
    content: (
      <>
        <p>We may use third-party services for:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Email delivery (OTP systems)</li>
          <li>Payment processing</li>
          <li>Analytics</li>
        </ul>
        <p className="mt-2">These services follow their own privacy policies.</p>
      </>
    ),
  },
  {
    icon: <Baby className="w-5 h-5" />,
    number: "11",
    title: "Children's Privacy",
    content: (
      <p>Our platform is not intended for users under 18.</p>
    ),
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    number: "12",
    title: "Changes to Privacy Policy",
    content: (
      <p>We may update this policy. Continued use means you accept the changes.</p>
    ),
  },
  {
    icon: <Phone className="w-5 h-5" />,
    number: "13",
    title: "Contact Us",
    content: (
      <p>
        For privacy concerns:{" "}
        <a href="mailto:privacy@teablendai.com" className="text-green-600 hover:underline font-medium">
          privacy@teablendai.com
        </a>
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
            Your privacy matters. Learn how TeaBlend AI collects, uses, and safeguards your personal information.
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
            Have privacy concerns or questions?
          </p>
          <Link
            href="mailto:privacy@teablendai.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <Mail className="w-4 h-4" />
            Contact Privacy Team
          </Link>
        </div>
      </main>
    </div>
  );
}
