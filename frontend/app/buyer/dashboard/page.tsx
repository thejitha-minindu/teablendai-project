"use client";
import React from "react";
import { ChartPie } from "@/components/features/buyer/ChartPie";
import { Calendar } from "@/components/ui/calendar";
import { AuctionHomePreview } from "@/components/features/buyer/AuctionHomePreview";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";

export default function BuyerAuctionPage() {
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
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
          className="flex flex-col md:col-span-2 lg:col-span-3 w-full m-0 gap-5 lg:gap-10 card-animate"
          style={{ animationDelay: "80ms" }}
        >
          <div>
            <AuctionHomePreview />
          </div>
          <div>
            <div>
              <h2 className="text-2xl font-bold my-4 mt-10">Watchlist</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              <div className="card-animate" style={{ animationDelay: "0ms" }}>
                <AuctionCard />
              </div>
              <div className="card-animate" style={{ animationDelay: "80ms" }}>
                <AuctionCard />
              </div>
              <div className="card-animate" style={{ animationDelay: "160ms" }}>
                <AuctionCard />
              </div>
            </div>
          </div>

          <div 
            className="flex flex-row justify-center sm:mt-10 mt-6 card-animate"
            style={{ animationDelay: "240ms" }}
          >
            <PaginationBuyerAuction />
          </div>
        </div>
      </div>
    </div>
  );
}
