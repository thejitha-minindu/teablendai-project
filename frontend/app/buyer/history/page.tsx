"use client";
import React, { useState } from "react";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { AuctionFilterSort } from "@/components/features/buyer/AuctionFilterSort";
import { Button } from "@/components/ui/button";

const AUCTION_DATA = [
  { id: 1, type: "live", title: "Auction 1" },
  { id: 2, type: "scheduled", title: "Auction 2" },
  { id: 3, type: "history", title: "Auction 3" },
  { id: 4, type: "live", title: "Auction 4" },
  { id: 5, type: "scheduled", title: "Auction 5" },
  { id: 6, type: "history", title: "Auction 6" },
  { id: 7, type: "live", title: "Auction 7" },
  { id: 8, type: "scheduled", title: "Auction 8" },
  { id: 9, type: "history", title: "Auction 9" },
];

export default function BuyerHistoryPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalCards = AUCTION_DATA.length;
  const initialCards = 3;
  const expandedCards = 6;
  const hasMoreCards = totalCards > initialCards;

  const visibleCards = isExpanded ? expandedCards : initialCards;
  const cardsToShow = AUCTION_DATA.slice(0, visibleCards);

  return (
    <div className="sm:px-4 lg:px-20 lg:pt-10">
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

      <div className="mb-5 items-start">
        <h1 className="text-3xl font-bold">Auction History</h1>
      </div>

      <AuctionFilterSort />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
        {cardsToShow.map((auction, index) => (
          <div
            key={auction.id}
            className="flex flex-col w-full card-animate"
            style={{
              animationDelay: `${index * 80}ms`,
            }}
          >
            <AuctionCard />
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-10 transition-all duration-300">
        {!isExpanded && hasMoreCards && (
          <div
            style={{
              animation: "fadeInUp 0.4s ease-out",
            }}
          >
            <Button
              onClick={() => setIsExpanded(true)}
              size="lg"
              variant="outline"
              className="px-12 h-11"
            >
              Load More
            </Button>
          </div>
        )}

        {isExpanded && (
          <div
            style={{
              animation: "fadeInUp 0.4s ease-out",
            }}
          >
            <Button
              onClick={() => setIsExpanded(false)}
              size="lg"
              variant="outline"
              className="px-12 h-11"
            >
              Show Less
            </Button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div
          className="flex flex-row justify-center sm:mt-10 mt-6"
          style={{
            animation: "fadeInUp 0.5s ease-out",
          }}
        >
          <PaginationBuyerAuction />
        </div>
      )}
    </div>
  );
}
