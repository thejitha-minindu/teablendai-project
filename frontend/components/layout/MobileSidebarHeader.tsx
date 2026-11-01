"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function MobileSidebarHeader({ showNotifications = true }: { showNotifications?: boolean }) {
  const { toggleSidebar, openMobile } = useSidebar();

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open navigation"
        aria-expanded={openMobile}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[#3A5A40] hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#3A5A40]"
      >
        <Menu className="size-6" />
      </button>
      <Image src="/TeaLogo.png" alt="TeaBlend AI" width={112} height={48} className="h-12 w-28 object-contain" />
      {showNotifications ? <NotificationBell /> : <span className="size-11" aria-hidden="true" />}
    </header>
  );
}
