import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/layout/NavSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="seller">
      <SidebarProvider>
        <NavSidebar />
        {/* Placed here, it will sit tightly next to the sidebar */}
        <main className="p-10 h-max-screen w-full">
          {children}
        </main>
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  );
}