import { BuyerNavBar } from "@/components/layout/BuyerNavBar";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-(--background-color)">
      <BuyerNavBar />
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}