"use client";
import React, { useState } from "react";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import {
  AuctionFilterSort,
  FilterState,
} from "@/components/features/buyer/AuctionFilterSort";
import { Button } from "@/components/ui/button";

const AUCTION_DATA = [
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

export default function BuyerHistoryPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    grade: "all",
    status: "all",
  });
  const [sortBy, setSortBy] = useState("recent");

  // Filtering
  const filteredData = AUCTION_DATA.filter((auction) => {
    // Search filter
    const query = filters.searchQuery?.toLowerCase() || "";
    const matchesSearch =
      !query ||
      auction.title.toLowerCase().includes(query) ||
      auction.company.toLowerCase().includes(query) ||
      auction.estateName.toLowerCase().includes(query) ||
      (auction.grade && auction.grade.toLowerCase().includes(query));

    // Grade filter
    let matchesGrade = true;
    if (filters.grade && filters.grade !== "all") {
      // Map your actual grade values to filter options
      const gradeMap: Record<string, string[]> = {
        A: ["FTGFOP1", "SFTGFOP", "Silver Needle"],
        B: ["BOP", "OP", "FBOP", "TGFOP"],
        C: ["Herbal"],
      };
      matchesGrade = gradeMap[filters.grade]?.includes(auction.grade) || false;
    }

    // Status filter
    let matchesStatus = true;
    if (filters.status && filters.status !== "all") {
      matchesStatus = auction.type === filters.status;
    }

    // Price range filter
    let matchesPrice = true;
    if (filters.priceMin || filters.priceMax) {
      const price = parseInt(auction.basePrice.replace(/[^\d]/g, ""));
      const min = filters.priceMin || 0;
      const max = filters.priceMax || Infinity;
      matchesPrice = price >= min && price <= max;
    }

    return matchesSearch && matchesGrade && matchesStatus && matchesPrice;
  });

  // Sorting logic
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "price-high") {
      const priceA = parseInt(a.basePrice.replace(/[^\d]/g, "")) || 0;
      const priceB = parseInt(b.basePrice.replace(/[^\d]/g, "")) || 0;
      return priceB - priceA;
    }
    if (sortBy === "price-low") {
      const priceA = parseInt(a.basePrice.replace(/[^\d]/g, "")) || 0;
      const priceB = parseInt(b.basePrice.replace(/[^\d]/g, "")) || 0;
      return priceA - priceB;
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

      {/* No Results Message */}
      {sortedData.length === 0 && (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {/* Auction Cards Grid */}
      {sortedData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
            {cardsToShow.map((auction, index) => (
              <div
                key={auction.id}
                className="flex flex-col w-full card-animate"
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <AuctionCard cardType="auction" auction={auction} />
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
