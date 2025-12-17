"use client";
import React, { useState } from "react";
import { ChartPie } from "@/components/features/buyer/ChartPie";
import { Calendar } from "@/components/ui/calendar";
import { AuctionHomePreview } from "@/components/features/buyer/AuctionHomePreview";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { useSidebar } from "@/components/ui/sidebar";

const WATCHLIST_DATA = [
  { id: 1, title: "Watchlist Auction 1" },
  { id: 2, title: "Watchlist Auction 2" },
  { id: 3, title: "Watchlist Auction 3" },
  { id: 4, title: "Watchlist Auction 4" },
  { id: 5, title: "Watchlist Auction 5" },
];

export default function BuyerAuctionPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { open: isSidebarOpen } = useSidebar();
  
  // Adjust items per page based on sidebar state
  const itemsPerPage = isSidebarOpen ? 2 : 3;
  const totalItems = WATCHLIST_DATA.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWatchlist = WATCHLIST_DATA.slice(startIndex, endIndex);

  return (
    <div className="sm:px-4">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card-animate {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mb-10">
        <div 
          className="flex flex-col md:col-span-1 lg:col-span-1 card-animate"
          style={{ animationDelay: "0ms" }}
        >
          <ChartPie />
          <div className="mt-10">
            <Calendar />
          </div>
        </div>
        <div 
          className="flex flex-col md:col-span-2 lg:col-span-3 w-full m-0 gap-10 lg:gap-10 card-animate"
          style={{ animationDelay: "80ms" }}
        >
          <div>
            <AuctionHomePreview />
          </div>
            <div>
            <div>
              <h2 className="text-2xl font-bold my-4 mt-5">Watchlist</h2>
            </div>
            <div
              className={`
              grid grid-cols-1
              ${isSidebarOpen ? "md:grid-cols-2 lg:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-3"}
              gap-6 w-full
              `}
            >
              {paginatedWatchlist.map((item, index) => (
              <div key={item.id} className="card-animate" style={{ animationDelay: `${index * 80}ms` }}>
                <AuctionCard cardType="auction"/>
              </div>
              ))}
            </div>
            </div>

            <div 
            className="flex flex-row justify-center sm:mt-15 lg:mt-0 card-animate"
            style={{ animationDelay: "240ms" }}
            >
            <PaginationBuyerAuction 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage}
            />
            </div>
        </div>
      </div>
    </div>
  );
}
