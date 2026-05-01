"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, Users, Ban, Brain, CreditCard, XCircle, BookOpen, AlertTriangle, RefreshCw, Mail } from "lucide-react";

const sections = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    number: "1",
    title: "Introduction",
    content: (
      <>
        <p>
          Welcome to TeaBlend AI. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree, you must not use our services.
        </p>
        <p className="mt-2">
          TeaBlend AI provides AI-powered tools for tea blending, market analysis, export insights, and user account management.
        </p>
      </>
    ),
  },
  {
    icon: <Users className="w-5 h-5" />,
    number: "2",
    title: "Eligibility",
    content: (
      <>
        <p>To use our platform:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>You must provide accurate and complete registration information</li>
          <li>Your account must be approved by the admin before full access is granted</li>
        </ul>
        <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these conditions.</p>
      </>
    ),
  },
  {
    icon: <Shield className="w-5 h-5" />,
    number: "3",
    title: "User Accounts",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Users must register using a valid email address</li>
        <li>OTP verification may be required for login and password recovery</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials</li>
        <li>Any activity under your account is your responsibility</li>
      </ul>
    ),
  },
  {
    icon: <Users className="w-5 h-5" />,
    number: "4",
    title: "Account Approval System",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Newly registered users are marked as &ldquo;Pending&rdquo;</li>
        <li>Only admin-approved users can access full features (buyer/seller dashboards)</li>
        <li>We reserve the right to approve or reject accounts without explanation</li>
      </ul>
    ),
  },
  {
    icon: <Ban className="w-5 h-5" />,
    number: "5",
    title: "Use of Services",
    content: (
      <>
        <p>
          You agree to use the platform responsibly and in compliance with all applicable laws and regulations. The following activities are strictly prohibited and may result in account suspension or termination:
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-2">
          <li><strong>Fraud:</strong> Engaging in any fraudulent activity, including providing false financial, business, or identity information.</li>
          <li><strong>Scam:</strong> Attempting to deceive other users for personal or financial gain, including fake offers, misleading deals, or dishonest transactions.</li>
          <li><strong>Harassment:</strong> Sending abusive, threatening, or harmful messages, or engaging in any behavior that creates an unsafe environment for other users.</li>
          <li><strong>Fake Product:</strong> Listing, promoting, or selling products that are counterfeit, misrepresented, or do not match their description.</li>
          <li><strong>Payment Issues:</strong> Manipulating, bypassing, or exploiting the platform&apos;s payment systems, including unauthorized transactions or payment fraud.</li>
          <li><strong>Other Violations:</strong> Any additional activities that violate ethical standards, platform policies, or applicable laws, including misuse of AI tools for harmful or misleading purposes.</li>
        </ul>
        <p className="mt-3 text-gray-500 italic text-sm">
          TeaBlend AI reserves the right to investigate any reported violations and take appropriate action, including warning, suspension, or permanent removal of user accounts.
        </p>
      </>
    ),
  },
  {
    icon: <Brain className="w-5 h-5" />,
    number: "6",
    title: "AI-Generated Content Disclaimer",
    content: (
      <>
        <p>Our AI tools provide recommendations and insights:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Results are not guaranteed to be accurate</li>
          <li>Users should verify outputs before making business decisions</li>
          <li>TeaBlend AI is not responsible for losses based on AI outputs</li>
        </ul>
      </>
    ),
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    number: "7",
    title: "Payments and Subscriptions",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Some features may require payment or subscription</li>
        <li>Payments are non-refundable unless stated otherwise</li>
        <li>We may change pricing at any time</li>
      </ul>
    ),
  },
  {
    icon: <XCircle className="w-5 h-5" />,
    number: "8",
    title: "Termination",
    content: (
      <>
        <p>We may suspend or terminate your account if:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>You violate these terms</li>
          <li>You misuse the system</li>
          <li>Your account remains inactive for a long period</li>
        </ul>
      </>
    ),
  },
  {
    icon: <FileText className="w-5 h-5" />,
    number: "9",
    title: "Intellectual Property",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>All content, branding, and AI systems belong to TeaBlend AI</li>
        <li>You may not copy, distribute, or resell our services without permission</li>
      </ul>
    ),
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    number: "10",
    title: "Limitation of Liability",
    content: (
      <>
        <p>TeaBlend AI is not responsible for:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Data loss</li>
          <li>Business losses</li>
          <li>System downtime</li>
          <li>Errors in AI-generated results</li>
        </ul>
      </>
    ),
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    number: "11",
    title: "Changes to Terms",
    content: (
      <p>
        We may update these Terms at any time. Continued use of the platform means you accept the updated terms.
      </p>
    ),
  },
  {
    icon: <Mail className="w-5 h-5" />,
    number: "12",
    title: "Contact",
    content: (
      <p>
        For any questions, contact us at:{" "}
        <a href="mailto:support@teablendai.com" className="text-green-600 hover:underline font-medium">
          support@teablendai.com
        </a>
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
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
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-lg mx-auto">
            Please read these terms carefully before using TeaBlend AI. By accessing the platform you agree to be bound by these terms.
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
            Have questions about our terms?
          </p>
          <Link
            href="mailto:support@teablendai.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
