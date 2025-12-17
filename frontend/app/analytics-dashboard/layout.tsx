"use client";

<<<<<<< Updated upstream
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/layout/NavSidebar";
=======
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, TrendingUp, Package, 
  BarChart3, Users, Home 
} from 'lucide-react';
>>>>>>> Stashed changes

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
<<<<<<< Updated upstream
  return (
    <SidebarProvider>
      <NavSidebar />
      <main className="p-10 m-7 h-max-screen w-full">
        {children}
      </main>
    </SidebarProvider>
=======
  const pathname = usePathname();

  const navItems = [
    { href: '/analytics-dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/analytics/purchases', label: 'Purchase Analytics', icon: ShoppingCart },
    { href: '/analytics/sales', label: 'Sales & Auction', icon: TrendingUp },
    { href: '/analytics/blends', label: 'Blend Performance', icon: Package },
    { href: '/analytics/supply-demand', label: 'Supply vs Demand', icon: BarChart3 },
    { href: '/analytics/buyers', label: 'Buyer Behavior', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="p-6">
          <img className="w-60 h-24" src="/TeaLogo.png" alt="Tea Logo" />
          <div className="mt-4 pt-8 border-t border-gray-200" />
          <h1 className="text-xl font-bold text-gray-900 mb-6">Tea Analytics</h1>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
>>>>>>> Stashed changes
  );
}
