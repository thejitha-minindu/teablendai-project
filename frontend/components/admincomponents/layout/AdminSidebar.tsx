"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ShieldCheck,
  Gavel,
  ScrollText,
  AlertTriangle,
  Bell,
  User2,
  ChevronUp,
  LogOut,
  PanelLeftIcon,
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

/* ================= ADMIN MENU ================= */
const adminMenu = [
  { title: "Dashboard", href: "/admin/dashboard", icon: Home },
  { title: "User Verification", href: "/admin/userverification", icon: ShieldCheck },
  { title: "Track Auction", href: "/admin/tracauction", icon: Gavel },
  { title: "System Logs", href: "/admin/systemlogs", icon: ScrollText },
  { title: "Violation Handling", href: "/admin/violationhandling", icon: AlertTriangle },
  { title: "Send Notification", href: "/admin/sendnotification", icon: Bell },
  { title: "Admin Profile", href: "/admin/user", icon: User2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter(); // FIX: Added router for logout redirect
  const { open } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActivePath = (href: string) => pathname === href;

  // FIX: Proper logout function
  const handleLogout = () => {
    // Clear all possible token keys used in the project
    localStorage.removeItem("teablend_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");

    // optional: clear session storage too
    sessionStorage.clear();

    // redirect to admin login page
    router.push("/auth/admin/login");
  };

  return (
    <div className="relative flex h-screen">
      {/* COLLAPSED BUTTON */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed left-0 top-4 z-50"
        >
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg hover:bg-gray-200"
          >
            <PanelLeftIcon className="w-5 h-5 rotate-180" />
          </button>
        </motion.div>
      )}

      {/* SIDEBAR */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sidebar className="flex flex-col h-screen border-r bg-[#F9FAFB]">
              <SidebarContent className="flex-1">
                {/* LOGO */}
                <SidebarGroup>
                  <div className="flex items-center justify-between px-2 py-4">
                    <Image
                      src="/TeaLogo.png"
                      alt="Logo"
                      width={140}
                      height={60}
                      className="object-contain"
                    />
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="p-2 rounded-lg hover:bg-gray-200"
                    >
                      <PanelLeftIcon className="w-5 h-5" />
                    </button>
                  </div>
                </SidebarGroup>

                {/* MENU */}
                <SidebarGroup>
                  <SidebarGroupContent className="px-3">
                    <SidebarMenu>
                      {adminMenu.map((item) => {
                        const Icon = item.icon;
                        const active = isActivePath(item.href);

                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              className={`p-3 rounded-md transition-all ${
                                active
                                  ? "bg-[#E5F7CB] text-[#3A5A40] font-bold border-l-4 border-[#3A5A40]"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <Link
                                href={item.href}
                                className="flex gap-3 items-center"
                              >
                                <Icon className="w-5 h-5" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              {/* FOOTER PROFILE */}
              <SidebarFooter className="p-4 border-t bg-white">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="w-full">
                          <div className="flex gap-3 items-center w-full">
                            <div className="w-8 h-8 rounded-full bg-[#E5F7CB] flex items-center justify-center">
                              <User2 className="w-5 h-5 text-[#3A5A40]" />
                            </div>

                            <div className="flex-1 text-left">
                              <p className="font-semibold">Admin</p>
                              <p className="text-xs text-gray-500">
                                Administrator
                              </p>
                            </div>

                            <ChevronUp className="w-4 h-4" />
                          </div>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        side="top"
                        align="end"
                        className="w-56"
                      >
                        <DropdownMenuLabel>
                          Admin Account
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                          <Link href="/admin/user">My Profile</Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* FIX: Logout now works properly */}
                        <DropdownMenuItem
                          className="text-red-600 cursor-pointer"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}