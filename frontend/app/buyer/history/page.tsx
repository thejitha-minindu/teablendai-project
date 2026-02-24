
"use client";
import React, { useState, useMemo } from "react";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { HistoryFilterSort, FilterState } from "@/components/features/buyer/HistoryFilterSort";
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
    soldPrice: "$750",
    winner: "Buyer A",
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
    soldPrice: "$600",
    winner: "Buyer B",
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
    soldPrice: "$850",
    winner: "Buyer C",
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
    soldPrice: "$780",
    winner: "Buyer D",
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
    soldPrice: "$950",
    winner: "Buyer E",
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
    soldPrice: "$720",
    winner: "Buyer F",
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
    soldPrice: "$880",
    winner: "Buyer G",
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
    soldPrice: "$1,050",
    winner: "Buyer H",
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
    soldPrice: "$500",
    winner: "Buyer I",
  },
];

export default function BuyerHistoryPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ searchQuery: "" });
  const [sortBy, setSortBy] = useState<string>("recent");

  // Filter and sort the auction data
  const filteredAndSortedData = useMemo(() => {
    let result = [...AUCTION_DATA];

    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      result = result.filter(auction =>
        auction.title.toLowerCase().includes(searchLower) ||
        auction.company.toLowerCase().includes(searchLower) ||
        auction.estateName.toLowerCase().includes(searchLower) ||
        auction.grade.toLowerCase().includes(searchLower) ||
        auction.id.toString().includes(searchLower)
      );
    }

    if (filters.grade) {
      result = result.filter(auction => auction.grade.includes(filters.grade!));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-high":
          return parseFloat(b.basePrice.replace('$', '')) - parseFloat(a.basePrice.replace('$', ''));
        case "price-low":
          return parseFloat(a.basePrice.replace('$', '')) - parseFloat(b.basePrice.replace('$', ''));
        case "grade":
          return a.grade.localeCompare(b.grade);
        case "name":
          return a.title.localeCompare(b.title);
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [filters, sortBy]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sort changes
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  const itemsPerPage = 6;
  const totalCards = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalCards / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  const initialCards = 3;
  const expandedCards = 6;
  const hasMoreCards = totalCards > initialCards;

  const cardsToShow = isExpanded 
    ? paginatedData 
    : filteredAndSortedData.slice(0, Math.min(initialCards, totalCards));

  // Show "No results" message if no auctions match filters
  if (totalCards === 0) {
    return (
      <div className="sm:px-4 lg:px-10 lg:pt-10">
        <div className="mb-5 items-start">
          <h1 className="text-3xl font-bold">Auction History</h1>
        </div>

        <HistoryFilterSort 
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          initialFilters={filters}
          initialSort={sortBy}
        />

        <div className="text-center py-20">
          <h3 className="text-xl font-medium mb-2">No auctions found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
          <Button 
            onClick={() => {
              handleFilterChange({ searchQuery: "" });
              setSortBy("recent");
            }}
            variant="outline"
            className="mt-4"
          >
            Clear all filters
          </Button>
        </div>
      </div>
    );
  }

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
        <p className="text-muted-foreground mt-1">
          Showing {filteredAndSortedData.length} auction{filteredAndSortedData.length !== 1 ? 's' : ''}
        </p>
      </div>

      <HistoryFilterSort 
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        initialFilters={filters}
        initialSort={sortBy}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
        {cardsToShow.map((auction, index) => (
          <div
            key={auction.id}
            className="flex flex-col w-full card-animate"
            style={{
              animationDelay: `${index * 80}ms`,
            }}
          >
            <AuctionCard cardType="history" auction={auction} />
          </div>
        ))}
      </div>

      {/* Only show load more/show less if we have more than initial cards */}
      {totalCards > initialCards && (
        <div className="flex justify-center mb-10 transition-all duration-300">
          {!isExpanded && (
            <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
              <Button
                onClick={() => setIsExpanded(true)}
                size="lg"
                variant="outline"
                className="px-12 h-11"
              >
                Load More ({totalCards - initialCards} more)
              </Button>
            </div>
          )}

          {isExpanded && (
            <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
              <Button
                onClick={() => {
                  setIsExpanded(false);
                  setCurrentPage(1);
                }}
                size="lg"
                variant="outline"
                className="px-12 h-11"
              >
                Show Less
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Only show pagination when expanded AND we have multiple pages */}
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
    </div>
  );
}
