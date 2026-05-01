"use client";
import React, { useState, useEffect } from "react";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import {
  AuctionFilterSort,
  FilterState,
} from "@/components/features/buyer/AuctionFilterSort";
import { Button } from "@/components/ui/button";

import { listAuctions } from "@/services/buyer/auctionService";

export default function BuyerHistoryPage() {
  const [auctionData, setAuctionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    grade: "all",
    status: "all",
  });
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      // list scheduled and live auctions
      const [scheduledAuctions, liveAuctions] = await Promise.all([
        listAuctions({ status: "Scheduled" }),
        listAuctions({ status: "Live" }),
      ]);
      
      const combinedData = [
        ...(liveAuctions || []),
        ...(scheduledAuctions || []),
      ];
      
      setAuctionData(combinedData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load auctions");
      setAuctionData([]);
      setLoading(false);
    }
  };

  // Filtering
  const filteredData = auctionData.filter((auction) => {
    // Get field values with fallback to legacy names
    const title = auction.auction_name || auction.title || "";
    const company = auction.company_name || auction.company || "";
    const estateName = auction.estate_name || auction.estateName || "";
    const grade = auction.grade || "";
    const basePrice = auction.base_price || auction.basePrice || 0;
    const rawStatus = String(auction.status || "").trim().toLowerCase();

    // Search filter
    const query = filters.searchQuery?.toLowerCase() || "";
    const matchesSearch =
      !query ||
      title.toLowerCase().includes(query) ||
      company.toLowerCase().includes(query) ||
      estateName.toLowerCase().includes(query) ||
      (grade && grade.toLowerCase().includes(query));

    // Grade filter
    let matchesGrade = true;
    if (filters.grade && filters.grade !== "all") {
      const gradeMap: Record<string, string[]> = {
        A: ["FTGFOP1", "SFTGFOP", "Silver Needle"],
        B: ["BOP", "OP", "FBOP", "TGFOP"],
        C: ["Herbal"],
      };
      matchesGrade = gradeMap[filters.grade]?.includes(grade) || false;
    }

    // Price range filter
    let matchesPrice = true;
    if (filters.priceMin || filters.priceMax) {
      const price = typeof basePrice === "number" ? basePrice : parseInt(String(basePrice).replace(/[^\d]/g, ""));
      const min = filters.priceMin || 0;
      const max = filters.priceMax || Infinity;
      matchesPrice = price >= min && price <= max;
    }

    let matchesStatus = true;
    if (filters.status && filters.status !== "all") {
      matchesStatus = rawStatus === filters.status;
    }

    return matchesSearch && matchesGrade && matchesPrice && matchesStatus;
  });

  // Sorting logic
  const sortedData = [...filteredData].sort((a, b) => {
    const basePrice_a = a.base_price || a.basePrice || 0;
    const basePrice_b = b.base_price || b.basePrice || 0;
    const priceA = typeof basePrice_a === "number" ? basePrice_a : parseInt(String(basePrice_a).replace(/[^\d]/g, "")) || 0;
    const priceB = typeof basePrice_b === "number" ? basePrice_b : parseInt(String(basePrice_b).replace(/[^\d]/g, "")) || 0;

    if (sortBy === "recent") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "price-high") {
      return priceB - priceA;
    }
    if (sortBy === "price-low") {
      return priceA - priceB;
    }
    if (sortBy === "ending-soon") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return 0;
  });

  const itemsPerPage = 6;
  const totalCards = sortedData.length;
  const totalPages = Math.ceil(totalCards / itemsPerPage);
  const initialCards = 3;
  const expandedCards = 6;
  const hasMoreCards = totalCards > initialCards;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const visibleCards = isExpanded ? expandedCards : initialCards;
  const cardsToShow = isExpanded
    ? paginatedData
    : sortedData.slice(0, visibleCards);

  // Update FilterSort component grade options to match your data:
  // In AuctionFilterSort.tsx, update GRADE_OPTIONS to:
  /*
  const GRADE_OPTIONS = [
    { value: "all", label: "All Grades" },
    { value: "A", label: "Premium (FTGFOP1, SFTGFOP, Silver Needle)" },
    { value: "B", label: "Standard (BOP, OP, FBOP, TGFOP)" },
    { value: "C", label: "Specialty (Herbal)" },
  ];
  */

  return (
    <div className="sm:px-4 lg:px-10 lg:pt-10">
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
        <h1 className="text-3xl font-bold">Auctions</h1>
      </div>

      <AuctionFilterSort
        onFilterChange={(f: FilterState) => {
          setFilters(f);
          setCurrentPage(1);
        }}
        onSortChange={(s: string) => {
          setSortBy(s);
          setCurrentPage(1);
        }}
      />

      {loading && (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">Loading auctions...</h3>
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">Failed to load auctions</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && sortedData.length === 0 && (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {!loading && !error && sortedData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
            {cardsToShow.map((auction, index) => (
              <div
                key={auction.id ?? `auction-card-${index}`}
                className="flex flex-col w-full h-full card-animate"
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <AuctionCard cardType="auction" auction={auction}/>
              </div>
            ))}
          </div>

          {/* Load More / Show Less Button */}
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

          {isExpanded && totalPages > 1 && (
            <div
              className="flex flex-row justify-center sm:mt-10 mt-6"
              style={{
                animation: "fadeInUp 0.5s ease-out",
              }}
            >
              <PaginationBuyerAuction
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}