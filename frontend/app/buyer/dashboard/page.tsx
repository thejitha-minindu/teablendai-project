"use client";
import React, { useState } from "react";
import { ChartPie } from "@/components/features/buyer/ChartPie";
import { Calendar } from "@/components/ui/calendar";
import { AuctionHomePreview } from "@/components/features/buyer/AuctionHomePreview";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { useSidebar } from "@/components/ui/sidebar";

const WATCHLIST_DATA = [
  {
    id: 1,
    type: "live",
    title: "Spring Harvest Auction",
    company: "ABC Tea Company",
    date: "2025-10-12",
    estateName: "Darjeeling Estate",
    time: "10:00 AM",
    quantity: "100 kg",
    grade: "FTGFOP1",
    basePrice: "$500",
  },
  {
    id: 2,
    type: "scheduled",
    title: "Summer Blend Auction",
    company: "GreenLeaf Ltd.",
    date: "2025-11-01",
    estateName: "Assam Valley",
    time: "2:00 PM",
    quantity: "80 kg",
    grade: "BOP",
    basePrice: "$400",
  },
  {
    id: 3,
    type: "live",
    title: "Autumn Reserve Auction",
    company: "Tea Masters",
    date: "2025-12-05",
    estateName: "Nilgiri Hills",
    time: "11:30 AM",
    quantity: "120 kg",
    grade: "OP",
    basePrice: "$600",
  },
  {
    id: 4,
    type: "scheduled",
    title: "Winter Classic Auction",
    company: "Royal Teas",
    date: "2026-01-15",
    estateName: "Ceylon Estate",
    time: "9:00 AM",
    quantity: "90 kg",
    grade: "FBOP",
    basePrice: "$550",
  },
  {
    id: 5,
    type: "live",
    title: "Monsoon Special Auction",
    company: "Sunrise Teas",
    date: "2026-02-20",
    estateName: "Kangra Valley",
    time: "3:00 PM",
    quantity: "70 kg",
    grade: "SFTGFOP",
    basePrice: "$700",
  },
  {
    id: 6,
    type: "scheduled",
    title: "First Flush Auction",
    company: "Heritage Teas",
    date: "2026-03-10",
    estateName: "Dooars Estate",
    time: "1:00 PM",
    quantity: "110 kg",
    grade: "TGFOP",
    basePrice: "$480",
  },
  {
    id: 7,
    type: "live",
    title: "Golden Tips Auction",
    company: "Golden Leaf",
    date: "2026-04-18",
    estateName: "Munnar Estate",
    time: "4:00 PM",
    quantity: "95 kg",
    grade: "FTGFOP1",
    basePrice: "$620",
  },
  {
    id: 8,
    type: "scheduled",
    title: "Silver Needle Auction",
    company: "Silver Teas",
    date: "2026-05-22",
    estateName: "Sikkim Estate",
    time: "12:00 PM",
    quantity: "85 kg",
    grade: "Silver Needle",
    basePrice: "$800",
  },
  {
    id: 9,
    type: "live",
    title: "Herbal Infusion Auction",
    company: "Herbal Harmony",
    date: "2026-06-30",
    estateName: "Anamalai Estate",
    time: "5:00 PM",
    quantity: "60 kg",
    grade: "Herbal",
    basePrice: "$350",
  },
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
                <AuctionCard cardType="auction" auction={item}/>
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
