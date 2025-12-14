import { NavSidebar } from "@/components/layout/NavSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <NavSidebar />
      <SidebarTrigger />
      <main className="p-10 h-max-screen w-full">
        {children}
      </main>
    </SidebarProvider>
  );
}