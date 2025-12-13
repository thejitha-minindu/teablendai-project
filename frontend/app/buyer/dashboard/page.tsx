import React from "react";
import { ChartPie } from "@/components/features/buyer/ChartPie";
import { Calendar } from "@/components/ui/calendar";
import { AuctionHomePreview } from "@/components/features/buyer/AuctionHomePreview";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";

export default function BuyerDashboardPage() {
  return (
    <div className="px-2 sm:px-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mb-10">
        <div className="flex flex-col md:col-span-1 lg:col-span-1">
          <ChartPie />
          <div className="mt-10">
            <Calendar />
          </div>
        </div>
        <div className="flex flex-col md:col-span-2 lg:col-span-3 w-full m-0 gap-5 lg:gap-10">
          <div>
            <AuctionHomePreview />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <AuctionCard />
            <AuctionCard />
            <AuctionCard />
          </div>
          <div className="flex flex-row justify-center sm:mt-10 mt-6">
            <PaginationBuyerAuction />
          </div>
        </div>
      </div>
    </div>
  );
}
