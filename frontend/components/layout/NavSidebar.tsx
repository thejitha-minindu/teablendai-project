"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  History,
  Gavel,
  CalendarClock,
  MessageSquare,
  Plus,
  User2,
  ChevronUp,
  LogOut,
  ShoppingBag,
  User,
  Inbox,
  Calendar,
  Search,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Configuration: Menu Items ---
const sellerNavItems = [
  { name: "Home", href: "/seller/dashboard", icon: Home },
  { name: "Auction History", href: "/seller/history", icon: History },
  { name: "Live Auction", href: "/seller/live", icon: Gavel },
  { name: "Scheduled Auction", href: "/seller/scheduled", icon: CalendarClock },
  { name: "Chat Bot", href: "/chatbot", icon: MessageSquare },
];

const buyerNavItems = [
  { name: "Dashboard", href: "/buyer/dashboard", icon: Home },
  { name: "History", href: "/buyer/history", icon: Inbox },
  { name: "Orders", href: "/buyer/orders", icon: Calendar },
  { name: "Browse Auctions", href: "/buyer/browse", icon: Search },
  { name: "Chat Bot", href: "/chatbot", icon: MessageSquare },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  
  // State to track role (default to seller)
  const [role, setRole] = useState<"seller" | "buyer">("seller");

  // --- FIX: Sync Role with URL ---
  useEffect(() => {
    // 1. If URL contains '/buyer', force Buyer Mode
    if (pathname?.startsWith("/buyer")) {
      setRole("buyer");
      localStorage.setItem("role", "buyer");
    } 
    // 2. If URL contains '/seller', force Seller Mode
    else if (pathname?.startsWith("/seller")) {
      setRole("seller");
      localStorage.setItem("role", "seller");
    } 
    // 3. For neutral pages (like /chatbot), keep existing or check storage
    else {
      const stored = localStorage.getItem("role") as "seller" | "buyer";
      if (stored) setRole(stored);
    }
  }, [pathname]); // Run this whenever the URL changes

  // Determine which menu items to show
  const navItems = role === "buyer" ? buyerNavItems : sellerNavItems;

  return (
    <Sidebar className="flex flex-col h-screen border-r border-gray-200 bg-[#F9FAFB]">
      <SidebarContent className="flex-1 flex flex-col">
        
        {/* 1. Logo Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="p-8 flex justify-center">
            <div className="relative h-20 w-56">
              <Image
                src="/TeaLogo.png"
                alt="TeaBlend AI Logo"
                fill
                sizes="(max-width: 768px) 100vw, 224px"
                className="object-contain object-center"
                priority
              />
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* 2. Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent className="px-3 space-y-4">
            
            {/* CONDITIONAL: "Create Auction" Button (Only for Sellers) */}
            {role === "seller" && (
              <div className="mb-6">
                <Link href="/seller/create-auction">
                  <button className="w-full flex items-center justify-center gap-2 bg-[#3A5A40] text-white py-3 rounded-lg font-bold shadow-md hover:bg-[#2A402E] transition-all hover:shadow-lg transform hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" />
                    <span className={open ? "block" : "hidden"}>Create Auction</span>
                  </button>
                </Link>
              </div>
            )}

            {/* Menu Items Loop */}
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        w-full transition-all duration-200 rounded-md p-3
                        ${isActive 
                            ? "bg-[#E5F7CB] text-[#3A5A40] font-bold border-l-4 border-[#3A5A40]" 
                            : "text-gray-600 hover:bg-gray-100 hover:text-[#3A5A40]"
                        }
                      `}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-[#3A5A40]" : "text-gray-500"}`} />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer: User Profile */}
      <SidebarFooter className="p-4 border-t border-gray-200 bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E5F7CB] text-[#3A5A40]">
                        <User2 className="w-5 h-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-gray-800">Thejitha Minindu</span>
                      <span className="truncate text-xs text-gray-500 capitalize">{role} Account</span>
                    </div>
                    <ChevronUp className="ml-auto w-4 h-4 text-gray-500" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              
              {/* Profile Dropdown Content */}
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg bg-white shadow-xl border border-gray-100 mb-2"
              >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">Thejitha Minindu</span>
                            <span className="truncate text-xs text-gray-500">thejitha@example.com</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                
                {/* Dynamic Switch Role Link */}
                <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
                  {/* Using Link automatically triggers the useEffect above via pathname change */}
                  <Link href={role === "seller" ? "/buyer/dashboard" : "/seller/dashboard"} className="flex items-center w-full">
                    <ShoppingBag className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Switch to {role === "seller" ? "Buyer" : "Seller"}</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}