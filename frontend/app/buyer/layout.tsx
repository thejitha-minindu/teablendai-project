import { NavSidebar } from "@/components/layout/NavSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Buyer routes are protected and require authentication
    <ProtectedRoute requiredRole="buyer">
      <SidebarProvider>
        <NavSidebar />
        <main className="p-10 m-7 h-max-screen w-full">
          {children}
        </main>
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  );
}