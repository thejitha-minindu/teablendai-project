"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { listAuctionsOrder } from "@/services/buyer/auctionService";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import { OrderFilterSort, FilterState } from "@/components/features/buyer/OrderFilterSort";
import { Button } from "@/components/ui/button";

export default function BuyerOrderPage() {

  const [orderData, setOrderData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ searchQuery: "" });
  const [sortBy, setSortBy] = useState("recent");

  // TODO: Replace with actual user id from auth context
  const userId = "11111111-1111-1111-1111-111111111111";

  useEffect(() => {
    setLoading(true);
    setError(null);
    listAuctionsOrder(userId)
      .then((data) => {
        setOrderData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load orders");
        setOrderData([]);
        setLoading(false);
      });
  }, [userId]);

  const AUCTION_DATA = orderData;


  const filteredAndSortedData = useMemo(() => {
    let result = [...AUCTION_DATA];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(item => {
        // Defensive: handle missing fields
        const title = item.title || item.auctionName || item.auction_name || "";
        const company = item.company || item.companyName || item.company_name || "";
        const estate = item.estateName || item.estate_name || "";
        const orderId = item.orderId || item.order_id || "";
        const grade = item.grade || "";
        return (
          title.toLowerCase().includes(query) ||
          company.toLowerCase().includes(query) ||
          estate.toLowerCase().includes(query) ||
          orderId.toLowerCase().includes(query) ||
          grade.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => {
          const dateA = new Date(a.date || a.orderDate || a.order_date || 0).getTime();
          const dateB = new Date(b.date || b.orderDate || b.order_date || 0).getTime();
          return dateB - dateA;
        });
        break;
      case "price-high":
        result.sort((a, b) => {
          const priceA = parseFloat((a.soldPrice || a.totalAmount || a.total_amount || "0").toString().replace(/[^0-9.-]+/g, ""));
          const priceB = parseFloat((b.soldPrice || b.totalAmount || b.total_amount || "0").toString().replace(/[^0-9.-]+/g, ""));
          return priceB - priceA;
        });
        break;
      case "price-low":
        result.sort((a, b) => {
          const priceA = parseFloat((a.soldPrice || a.totalAmount || a.total_amount || "0").toString().replace(/[^0-9.-]+/g, ""));
          const priceB = parseFloat((b.soldPrice || b.totalAmount || b.total_amount || "0").toString().replace(/[^0-9.-]+/g, ""));
          return priceA - priceB;
        });
        break;
      case "name":
        result.sort((a, b) => {
          const nameA = (a.title || a.auctionName || a.auction_name || "").toLowerCase();
          const nameB = (b.title || b.auctionName || b.auction_name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      default:
        break;
    }

    return result;
  }, [AUCTION_DATA, filters.searchQuery, sortBy]);

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

      {loading ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">Loading orders...</h3>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : filteredAndSortedData.length === 0 ? (
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
                key={auction.id || auction.orderId || auction.order_id || `auction-${index}`}
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
