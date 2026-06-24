"use client";
import { useState, useMemo, useEffect } from "react";
import { listAuctionsHistory } from "@/services/buyer/auctionService";
import { AuctionCard } from "@/components/features/buyer/AuctionCard";
import { PaginationBuyerAuction } from "@/components/features/buyer/Pagination";
import {
  HistoryFilterSort,
  FilterState,
} from "@/components/features/buyer/HistoryFilterSort";
import { Button } from "@/components/ui/button";
import { getAuthClaims } from "@/lib/auth";

const AUCTION_DATA_FALLBACK: any[] = [];

export default function BuyerHistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ searchQuery: "" });
  const [sortBy, setSortBy] = useState<string>("recent");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const claims = getAuthClaims();
    setUserId(claims?.id ?? null);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Missing authenticated user");
      return;
    }

    setLoading(true);
    setError(null);
    listAuctionsHistory(userId, true)
      .then((data) => {
        setHistoryData(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load auction history");
        setHistoryData(AUCTION_DATA_FALLBACK);
        setLoading(false);
      });
  }, [userId]);

  // Use fetched data or fallback
  const AUCTION_DATA =
    historyData.length > 0 ? historyData : AUCTION_DATA_FALLBACK;

  // Filter and sort the auction data
  const filteredAndSortedData = useMemo(() => {
    let result = [...AUCTION_DATA];

    const getPrice = (auction: any) => {
      const basePrice = auction.base_price ?? auction.basePrice ?? 0;
      return typeof basePrice === "number"
        ? basePrice
        : parseFloat(String(basePrice).replace(/[^\d.]/g, "")) || 0;
    };

    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      result = result.filter(
        (auction) => {
          const title = String(auction.title || auction.auction_name || "Auction").toLowerCase();
          const company = String(auction.company || auction.company_name || "-").toLowerCase();
          const estateName = String(auction.estateName || auction.estate_name || "-").toLowerCase();
          const grade = String(auction.grade || "-").toLowerCase();
          const idStr = String(auction.id || auction.auction_id || "").toLowerCase();

          return title.includes(searchLower) ||
            company.includes(searchLower) ||
            estateName.includes(searchLower) ||
            grade.includes(searchLower) ||
            idStr.includes(searchLower);
        }
      );
    }

    if (filters.grade) {
      result = result.filter((auction) =>
        String(auction.grade || "").includes(filters.grade!),
      );
    }

    result.sort((a, b) => {
      const titleA = String(a.title || a.auction_name || "Auction");
      const titleB = String(b.title || b.auction_name || "Auction");
      const gradeA = String(a.grade || "-");
      const gradeB = String(b.grade || "-");

      switch (sortBy) {
        case "price-high":
          return getPrice(b) - getPrice(a);
        case "price-low":
          return getPrice(a) - getPrice(b);
        case "grade":
          return gradeA.localeCompare(gradeB);
        case "name":
          return titleA.localeCompare(titleB);
        case "recent":
        default:
          return new Date(b.date || b.created_at || 0).getTime() - new Date(a.date || a.created_at || 0).getTime();
      }
    });

    return result;
  }, [AUCTION_DATA, filters, sortBy]);

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
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  const initialCards = 3;
  const hasMoreCards = totalItems > initialCards;

  const cardsToShow = isExpanded
    ? paginatedData
    : filteredAndSortedData.slice(0, Math.min(initialCards, totalItems));

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
        <h1 className="text-3xl font-bold">Auction History</h1>
        <p className="text-muted-foreground mt-2">
          {totalItems} auction{totalItems !== 1 ? "s" : ""} found
          {filters.searchQuery && ` for "${filters.searchQuery}"`}
        </p>
      </div>

      <HistoryFilterSort
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        initialFilters={filters}
        initialSort={sortBy}
      />

      {loading ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">
            Loading auction history...
          </h3>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">
            Failed to load auction history
          </h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : filteredAndSortedData.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 mb-10">
            {cardsToShow.map((auction, index) => (
              <div
                key={auction.id ?? `auction-${index}`}
                className="flex flex-col w-full card-animate"
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <AuctionCard cardType="history" auction={auction} />
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 mb-10 transition-all duration-300">
            {hasMoreCards && (
              <div style={{ animation: "fadeInUp 0.4s ease-out" }}>
                <Button
                  onClick={
                    isExpanded
                      ? () => {
                          setIsExpanded(false);
                          setCurrentPage(1);
                        }
                      : () => {
                          setIsExpanded(true);
                          setCurrentPage(1);
                        }
                  }
                  size="lg"
                  variant="outline"
                  className="px-12 h-11"
                >
                  {isExpanded
                    ? "Show Less"
                    : `Load More (${totalItems - initialCards} more)`}
                </Button>
              </div>
            )}

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
