"use client";
import { useSidebar } from "@/components/ui/sidebar";
import { Calendar, Home, Inbox, User2, ChevronUp } from "lucide-react";

import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Buyer menu items.
const Buyeritems = [
  {
    title: "Dashboard",
    url: "/buyer/dashboard",
    icon: Home,
  },
  {
    title: "History",
    url: "/buyer/history",
    icon: Inbox,
  },
  {
    title: "Orders",
    url: "/buyer/orders",
    icon: Calendar,
  },
];

// Seller menu items.
const Selleritems = [
  {
    title: "Dashboard",
    url: "/seller/dashboard",
    icon: Home,
  },
];

function SidebarToggleButton() {
  const { open, setOpen } = useSidebar();
  return (
    <button
      aria-label={open ? "Close Sidebar" : "Open Sidebar"}
      className="sidebar-toggle-btn"
      onClick={() => setOpen(!open)}
      style={{
        position: "relative",
        top: -30,
        left: 250,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <svg
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

function SidebarHeader() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="h-14 m-0 flex items-center justify-left">
        <a href="/">
          <img src="/logo.png" className="h-10 w-20" alt="Logo" />
        </a>
      </SidebarGroupLabel>
      <SidebarToggleButton />
    </SidebarGroup>
  );
}

function NavSidebarContent() {
  return (
    <SidebarGroup className="z-0">
      <SidebarGroupContent >
        {/* Replace this with your actual role logic */}
        {(() => {
          // Example: get role from localStorage or context
          const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
          const menuItems = role === "seller" ? Selleritems : Buyeritems;
          return (
            <SidebarMenu>
              {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
              ))}
            </SidebarMenu>
          );
        })()}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function NavSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader />
        <SidebarContent>
          <NavSidebarContent />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> Username
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-fit">
                  <DropdownMenuItem>
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
