"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavSidebar } from "@/components/layout/NavSidebar";


export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <NavSidebar />
      <main className="p-10 m-7 h-max-screen w-full">
        {children}
      </main>
    </SidebarProvider>
);
}
