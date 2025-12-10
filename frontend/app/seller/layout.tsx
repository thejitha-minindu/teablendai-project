import { SellerNavBar } from "@/components/layout/SellerNavBar";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* The Navbar sits at the top */}
      <SellerNavBar />
      
      {/* The 'children' represents the specific page user is viewing */}
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}