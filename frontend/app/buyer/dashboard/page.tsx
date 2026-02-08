"use client";
import React, { useState, useEffect } from "react";
import { listAuctionsWatchlist } from "@/services/buyer/auctionService";
import { ChartPie } from "@/components/features/buyer/ChartPie";
import { BuyerCalendar } from "@/components/features/buyer/BuyerCalendar";
import { AuctionHomePreview } from "@/components/features/buyer/AuctionHomePreview";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { useSidebar } from "@/components/ui/sidebar";


export default function BuyerAuctionPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { open: isSidebarOpen } = useSidebar();
  
  const userId = "11111111-1111-1111-1111-111111111111";

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = () => {
    setLoading(true);
    listAuctionsWatchlist(userId)
      .then((data) => {
        setWatchlist(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load watchlist");
        setWatchlist([]);
        setLoading(false);
      });
  };

  const handleWatchlistChange = () => {
    fetchWatchlist();
  };
  
  // Filter watchlist by selected date
  const filteredWatchlist = selectedDate
    ? watchlist.filter((item) => {
        const auctionDate = new Date(item.date);
        return auctionDate.toDateString() === selectedDate.toDateString();
      })
    : watchlist;

  const itemsPerPage = isSidebarOpen ? 2 : 3;
  const totalItems = filteredWatchlist.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWatchlist = filteredWatchlist.slice(startIndex, endIndex);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

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
          <div>
            <BuyerCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
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
              {loading ? (
                <div>Loading...</div>
              ) : paginatedWatchlist.length === 0 ? (
                <div className="text-center w-full col-span-full py-8 text-gray-500">add watch auction to the watchlist</div>
              ) : (
                paginatedWatchlist.map((item, index) => (
                  <div key={item.id || item.auction_id} className="card-animate" style={{ animationDelay: `${index * 80}ms` }}>
                    <AuctionCard
                      cardType="auction"
                      auction={item}
                      onWatchlistChange={handleWatchlistChange}
                    />
                  </div>
                ))
              )}
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
