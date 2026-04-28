"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Store } from "lucide-react"; // Icons for the Buyer and Seller cards
import { AuthCard } from "@/components/auth/AuthCard"; // A custom UI component for the selection cards

// --- Auth Selection Page ---
// This is the main `/auth` page. It asks the user whether they want to proceed as a Buyer or a Seller.
export default function AuthSelectPage() {
  // We use useSearchParams to grab URL parameters.
  // For example, if they clicked "Checkout" while logged out, the URL might look like `/auth?redirect=/checkout`.
  // We want to pass that `redirect` parameter along to the next page so we don't forget where they were trying to go.
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  
  // If there's a redirect, we build a query string like `?redirect=/checkout`.
  // If there isn't, we leave it empty.
  const redirectSuffix = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      
      {/* Header NavBar */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <img src="/Tealogo.png" className="h-15 w-35" alt="Tea Blend AI Logo" />
        </Link>

        <Link
          href="/"
          className="rounded-full border border-green-200 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-8 md:px-10 lg:px-12">
        <div className="w-full">
          
          {/* Title and Subtitle */}
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Choose Your Role & Get Started
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              Pick the experience that fits you best. Buyers can discover and manage purchases,
              while sellers can run auctions and grow their tea business.
            </p>
          </div>

          {/* Cards Container */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Buyer Card */}
            {/* We pass the paths to the buyer login and register pages, including the redirect suffix if it exists */}
            <AuthCard
              title="Buyer"
              description="Browse tea offerings, join auctions, manage orders, and track your buying activity in one place."
              icon={User}
              loginHref={`/auth/buyer/login${redirectSuffix}`}
              registerHref={`/auth/buyer/register${redirectSuffix}`}
            />
            
            {/* Seller Card */}
            {/* We pass the paths to the seller login and register pages, including the redirect suffix if it exists */}
            <AuthCard
              title="Seller"
              description="List products, manage auctions, and oversee seller operations with TeaBlend AI's marketplace tools."
              icon={Store}
              loginHref={`/auth/seller/login${redirectSuffix}`}
              registerHref={`/auth/seller/register${redirectSuffix}`}
            />
          </div>
        </div>
      </main>
    </div>
  );
}