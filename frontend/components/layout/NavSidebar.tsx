"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  PanelLeftIcon,
  LayoutDashboard
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type UserRole = "seller" | "buyer" | "analytics";

const sellerNavItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { name: "Auction History", href: "/seller/history", icon: History },
  { name: "Live Auction", href: "/seller/live", icon: Gavel },
  { name: "Scheduled Auction", href: "/seller/scheduled", icon: CalendarClock },
  { name: "Chat Bot", href: "/chatbot", icon: MessageSquare },
];

const buyerNavItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
  { name: "History", href: "/buyer/history", icon: Inbox },
  { name: "Orders", href: "/buyer/orders", icon: Calendar },
  { name: "Browse Auctions", href: "/buyer/browse", icon: Search },
  { name: "Chat Bot", href: "/chatbot", icon: MessageSquare },
];

const analyticsNavItems: NavItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Overview", href: "/analytics-dashboard", icon: LayoutDashboard },
  { name: "Purchase Analytics", href: "/analytics-dashboard/purchases", icon: ShoppingBag },
  { name: "Sales & Auction", href: "/analytics-dashboard/sales", icon: Gavel },
  { name: "Blend Performance", href: "/analytics-dashboard/blends", icon: History },
  { name: "Buyer Behavior", href: "/analytics-dashboard/buyers", icon: User },
];

function useRoleDetection(): UserRole {
  const pathname = usePathname();

  const role: UserRole = pathname.startsWith("/analytics-dashboard") 
    ? "analytics"
    : pathname.startsWith("/buyer")
    ? "buyer"
    : pathname.startsWith("/seller")
    ? "seller"
    : (localStorage.getItem("role") as UserRole) || "seller";

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  return role;
}

const getSwitchInfo = (currentRole: UserRole): { role: UserRole; path: string } => {
  switch(currentRole) {
    case "seller": return { role: "buyer", path: "/buyer/dashboard" };
    case "buyer": return { role: "seller", path: "/seller/dashboard" };
    case "analytics": return { role: "seller", path: "/seller/dashboard" };
    default: return { role: "buyer", path: "/buyer/dashboard" };
  }
};

const getRoleDisplayName = (role: UserRole): string => {
  switch(role) {
    case "seller": return "Seller";
    case "buyer": return "Buyer";
    case "analytics": return "Analytics";
    default: return "User";
  }
};

export function NavSidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const role = useRoleDetection();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActivePath = (href: string): boolean => pathname === href;

  const navItems = useMemo(() => {
    switch(role) {
      case "buyer": return buyerNavItems;
      case "analytics": return analyticsNavItems;
      default: return sellerNavItems;
    }
  }, [role]);

  const switchInfo = useMemo(() => getSwitchInfo(role), [role]);

  const isAnalyticsPage = pathname.startsWith("/analytics-dashboard");

  const shouldShowProfile = !isAnalyticsPage;

  return (
    <div className="relative flex h-screen">
      {/* Sidebar Collapsing and Expanding */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-0 top-4 z-50"
        >
          <button
            onClick={() => setIsCollapsed(false)}
            className="relative group p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeftIcon className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transform rotate-180" />
            <span
              className="absolute left-full ml-2 top-1/2 -translate-y-1/2
                          whitespace-nowrap rounded-xl bg-gray-900 px-2 py-1
                          text-xs text-white opacity-0 group-hover:opacity-100
                          transition-opacity pointer-events-none"
            >
            Expand sidebar
            </span>
          </button>
        </motion.div>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen"
          >
            <Sidebar className="flex flex-col h-screen border-r border-gray-200 bg-[#F9FAFB]">
              <SidebarContent className="flex-1 flex flex-col">
                <SidebarGroup>
                  <div className="flex items-center justify-between relative">
                    <div className="relative w-35 h-20">
                      <Image
                        src="/TeaLogo.png"
                        alt="TeaBlend AI Logo"
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-contain object-center"
                        priority
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCollapsed(true)}
                      className="relative group p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeftIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />

                      <span
                        className="absolute left-full ml-2 top-1/2 -translate-y-1/2
                                whitespace-nowrap rounded-xl bg-gray-900 px-2 py-1
                                text-xs text-white opacity-0 group-hover:opacity-100
                                transition-opacity pointer-events-none"
                      >
                        Collapse sidebar
                      </span>
                    </button>
                  </div>
                </SidebarGroup>

                <SidebarGroup>
                  <SidebarGroupContent className="px-3 space-y-4 flex-grow">
                    {role === "seller" && (
                      <div className="mb-6">
                        <Link
                          href="/seller/create-auction"
                          className="block focus:outline-none focus:ring-2 focus:ring-[#3A5A40] focus:ring-offset-2 rounded-lg"
                        >
                          <button className="w-full flex items-center justify-center gap-2 bg-[#3A5A40] text-white py-3 rounded-lg font-bold shadow-md hover:bg-[#2A402E] transition-all hover:shadow-lg">
                            <Plus className="w-5 h-5" aria-hidden="true" />
                            <span className={open ? "block" : "hidden"}>Create Auction</span>
                          </button>
                        </Link>
                      </div>
                    )}

                    <SidebarMenu>
                      {navItems.map((item) => {
                        const isActive = isActivePath(item.href);
                        const Icon = item.icon;

                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={`w-full transition-all duration-200 rounded-md p-3
                                ${isActive 
                                    ? "bg-[#E5F7CB] text-[#3A5A40] font-bold border-l-4 border-[#3A5A40]" 
                                    : "text-gray-600 hover:bg-gray-100 hover:text-[#3A5A40]"}`
                              }
                            >
                              <Link 
                                href={item.href} 
                                className="flex items-center gap-3"
                                aria-current={isActive ? "page" : undefined}
                              >
                                <Icon className={`w-5 h-5 ${isActive ? "text-[#3A5A40]" : "text-gray-500"}`} />
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

              {/* Footer with Profile */}
              {shouldShowProfile && (
                <SidebarFooter className="p-4 border-t border-gray-200 bg-white">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton
                            size="lg"
                            className="w-full hover:bg-gray-50"
                            aria-label="User profile menu"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div 
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E5F7CB] text-[#3A5A40]"
                                aria-hidden="true"
                              >
                                <User2 className="w-5 h-5" />
                              </div>
                              <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold text-gray-800">Kenmare Estate</span>
                                <span className="truncate text-xs text-gray-500 capitalize">
                                  {getRoleDisplayName(role)} Account
                                </span>
                              </div>
                              <ChevronUp className="ml-auto w-4 h-4 text-gray-500 transition-transform" />
                            </div>
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        
                        <DropdownMenuContent side="top" align="end" className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg bg-white shadow-xl border border-gray-100 mb-2">
                          <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2.5 text-left">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E5F7CB] text-[#3A5A40]">
                                <User2 className="w-6 h-6" />
                              </div>
                              <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Kenmare Estate</span>
                                <span className="truncate text-xs text-gray-500">kenmareestate@gmail.com</span>
                              </div>
                            </div>
                          </DropdownMenuLabel>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
                            <Link href="/profile" className="flex items-center w-full">
                              <User className="mr-2 h-4 w-4 text-gray-500" />
                              <span>My Profile</span>
                            </Link>
                          </DropdownMenuItem>

                          {/* Switch Role */}
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
                            <Link href={switchInfo.path} className="flex items-center w-full">
                              <ShoppingBag className="mr-2 h-4 w-4 text-gray-500" />
                              <span>Switch to {getRoleDisplayName(switchInfo.role)}</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          {/* Analytics Link */}
                          {role !== "analytics" && (
                            <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
                              <Link href="/analytics-dashboard" className="flex items-center w-full">
                                <History className="mr-2 h-4 w-4 text-gray-500" />
                                <span>Analytics Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                            onClick={() => {
                              localStorage.removeItem("role");
                              console.log("Logging out...");
                            }}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              )}
            </Sidebar>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
