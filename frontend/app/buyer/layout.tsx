import { NavSidebar } from "@/components/layout/NavSidebar";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-(--background-color)">
      <NavSidebar />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}