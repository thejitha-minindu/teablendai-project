import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  User2,
  ChevronUp,
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

export function NavSidebar() {
  return (
    <Sidebar className="flex flex-col h-screen">
      <SidebarContent className="flex-1 flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel className="p-10 pt-13">
            <div className="flex items-center justify-center">
              <img
                src="/logo.png"
                alt="TeaBlend Logo"
                className="h-10 w-auto mx-auto my-4"
              />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {(() => {
              // Example: get role from localStorage or context
              const role =
                typeof window !== "undefined"
                  ? localStorage.getItem("role")
                  : null;
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
        <div className="flex-1" />
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
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
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
      </SidebarContent>
    </Sidebar>
  );
}
