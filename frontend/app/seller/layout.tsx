import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/layout/NavSidebar";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <NavSidebar />
      {/* Placed here, it will sit tightly next to the sidebar */}
      <SidebarTrigger/> 
      
      <main className="p-10 h-max-screen w-full">
         {children}
      </main>
    </SidebarProvider>
  );
}