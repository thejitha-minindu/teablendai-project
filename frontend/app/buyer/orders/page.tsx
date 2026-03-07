"use client";
import React, { useState, useMemo, useCallback } from "react";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { OrderFilterSort, FilterState } from "@/components/features/buyer/OrderFilterSort";
import { Button } from "@/components/ui/button";

const AUCTION_DATA = [
  {
    id: 1,
    type: "order",
    title: "Spring Harvest Order",
    company: "ABC Tea Company",
    date: "2025-10-12",
    estateName: "Darjeeling Estate",
    quantity: "50 kg",
    grade: "BOP",
    soldPrice: "$250",
    orderId: "ORD123456",
  },
  {
    id: 2,
    type: "order",
    title: "Autumn Flush Order",
    company: "XYZ Tea Traders",
    date: "2025-11-05",
    estateName: "Assam Estate",
    quantity: "75 kg",
    grade: "CTC",
    soldPrice: "$375",
    orderId: "ORD123457",
  },
  {
    id: 3,
    type: "order",
    title: "Monsoon Special Order",
    company: "TeaLeaf Co.",
    date: "2025-09-20",
    estateName: "Nilgiri Estate",
    quantity: "100 kg",
    grade: "OP",
    soldPrice: "$500",
    orderId: "ORD123458",
  },
  {
    id: 4,
    type: "order",
    title: "Winter Reserve Order",
    company: "Premium Teas Ltd.",
    date: "2025-12-01",
    estateName: "Kangra Estate",
    quantity: "60 kg",
    grade: "FOP",
    soldPrice: "$300",
    orderId: "ORD123459",
  },
  {
    id: 5,
    type: "order",
    title: "Summer Blend Order",
    company: "Sunrise Teas",
    date: "2025-08-15",
    estateName: "Dooars Estate",
    quantity: "80 kg",
    grade: "BOPSM",
    soldPrice: "$400",
    orderId: "ORD123460",
  },
  {
    id: 6,
    type: "order",
    title: "Classic Assam Order",
    company: "Classic Tea House",
    date: "2025-07-10",
    estateName: "Assam Estate",
    quantity: "90 kg",
    grade: "CTC",
    soldPrice: "$450",
    orderId: "ORD123461",
  },
  {
    id: 7,
    type: "order",
    title: "Golden Tips Order",
    company: "Golden Leaf",
    date: "2025-06-18",
    estateName: "Darjeeling Estate",
    quantity: "40 kg",
    grade: "FTGFOP1",
    soldPrice: "$600",
    orderId: "ORD123462",
  },
];

// Types for better type safety
interface AuctionData {
  id: number;
  type: string;
  title: string;
  company: string;
  date: string;
  estateName: string;
  quantity: string;
  grade: string;
  soldPrice: string;
  orderId: string;
}

export default function BuyerOrderPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ searchQuery: "" });
  const [sortBy, setSortBy] = useState("recent");

  const filteredAndSortedData = useMemo(() => {
    let result = [...AUCTION_DATA];
    
    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.estateName.toLowerCase().includes(query) ||
        item.orderId.toLowerCase().includes(query) ||
        item.grade.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "price-high":
        result.sort((a, b) => {
          const priceA = parseFloat(a.soldPrice.replace(/[^0-9.-]+/g, ""));
          const priceB = parseFloat(b.soldPrice.replace(/[^0-9.-]+/g, ""));
          return priceB - priceA;
        });
        break;
      case "price-low":
        result.sort((a, b) => {
          const priceA = parseFloat(a.soldPrice.replace(/[^0-9.-]+/g, ""));
          const priceB = parseFloat(b.soldPrice.replace(/[^0-9.-]+/g, ""));
          return priceA - priceB;
        });
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    
    return result;
  }, [filters.searchQuery, sortBy]);

  const itemsPerPage = 6;
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    if (isExpanded) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredAndSortedData.slice(startIndex, endIndex);
    }
    return filteredAndSortedData.slice(0, 3);
  }, [filteredAndSortedData, isExpanded, currentPage]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    if (isExpanded) {
      setCurrentPage(1);
    }
  }, [isExpanded]);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    if (isExpanded) {
      setCurrentPage(1);
    }
  }, [isExpanded]);

  const handleLoadMore = () => {
    setIsExpanded(true);
    setCurrentPage(1); // Start at page 1 when expanding
  };

  const handleShowLess = () => {
    setIsExpanded(false);
    setCurrentPage(1); // Reset page when collapsing
  };

  const hasMoreCards = totalItems > 3;

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
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-2">
          {totalItems} order{totalItems !== 1 ? 's' : ''} found
          {filters.searchQuery && ` for "${filters.searchQuery}"`}
        </p>
      </div>

      <OrderFilterSort 
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        initialFilters={filters}
        initialSort={sortBy}
      />

      {filteredAndSortedData.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
            {paginatedData.map((auction, index) => (
              <div
                key={auction.id}
                className="flex flex-col w-full card-animate"
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <AuctionCard cardType="order" auction={auction} />
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 mb-10 transition-all duration-300">
            {/* Show Load More/Show Less when there are more than 3 items */}
            {hasMoreCards && (
              <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                <Button
                  onClick={isExpanded ? handleShowLess : handleLoadMore}
                  size="lg"
                  variant="outline"
                  className="px-12 h-11"
                >
                  {isExpanded ? "Show Less" : `Load More (${totalItems - 3} more)`}
                </Button>
              </div>
            )}

            {/* Show Pagination only when expanded AND there are multiple pages */}
            {isExpanded && totalPages > 1 && (
              <div
                className="flex flex-row justify-center"
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
        </>
      )}
    </div>
  );
}
