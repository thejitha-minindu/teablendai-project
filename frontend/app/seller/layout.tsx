import { SellerNavBar } from "@/components/layout/SellerNavBar";
import { AIChatButton } from "@/components/layout/AIChatButton"; // Import the new button

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F7EB] relative">
      {/* 1. Navigation Bar */}
      <SellerNavBar />
      
      {/* 2. Page Content */}
      <main>
        {children}
      </main>

      {/* 3. Global AI Button - Floats on top of everything */}
      <AIChatButton />
    </div>
  );
}