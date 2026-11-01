import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/layout/NavSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="seller">
      <SidebarProvider>
        <NavSidebar />
        {/* Placed here, it will sit tightly next to the sidebar */}
        <main className="min-w-0 flex-1 px-4 pb-6 pt-20 sm:px-6 md:p-8 lg:p-10">
          {children}
        </main>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
