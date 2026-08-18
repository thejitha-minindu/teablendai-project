"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { LiveAuctionModal } from '@/components/features/seller/AuctionModal';
import { AuctionFilterSort, FilterState } from "@/components/features/buyer/AuctionFilterSort";
import { apiClient } from '@/lib/apiClient';

import { parseBackendDateTime, calculateLiveCountdown } from "@/utils/dateFormatter";
import { getUserFromToken } from "@/utils/auth";

export default function LiveAuctionsPage() {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Live Auctions (Added cache busting)
  const fetchLiveAuctions = async () => {
    try {
      const payload = getUserFromToken();
      if (!payload || !payload.id) {
        setLoading(false);
        return;
      }
      const myUserId = payload.id;

      // Use apiClient and attach the seller_id to the URL
      const res = await apiClient.get(`/auctions/status/live?seller_id=${myUserId}`, {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });

      const data = res.data;

      const formattedData = data.map((item: any) => {
        // Parse the date just like the dashboard does
        const dateObj = parseBackendDateTime(item.start_time) || new Date();

        return {
          id: item.auction_id,
          displayId: `${item.grade} - ${item.origin}`,
          data: {
            price: item.highest_bid ?? item.base_price,
            grade: item.grade,
            quantity: item.quantity,
            custom_auction_id: item.custom_auction_id,
            buyer: item.buyer,
            buyer_name: item.buyer_name,
            countdown: calculateLiveCountdown(item.start_time, item.duration),
            rawStart: item.start_time,
            rawDuration: item.duration,
            // ADD THESE TWO LINES:
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            image_url: item.image_url
          }
        };
      });

      setAuctions(formattedData);
    } catch (error) {
      console.error("Error loading live auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initial Load
  useEffect(() => {
    fetchLiveAuctions();
  }, []);

  // 3. Update Countdowns & Auto-Reload
  useEffect(() => {
    const timer = setInterval(() => {
      setAuctions(prevAuctions => {

        // --- NEW LOGIC: Check for expired auctions ---
        const shouldReload = prevAuctions.some(auc => {
          const status = calculateLiveCountdown(auc.data.rawStart, auc.data.rawDuration);
          return status === "Closing...";
        });

        if (shouldReload) {
          console.log("Auction ended. Refreshing list...");
          fetchLiveAuctions(); // Reload from backend to remove the expired item
        }
        // ---------------------------------------------

        // CRITICAL: Only create new objects if countdown actually changed
        return prevAuctions.map(auc => {
          const newCountdown = calculateLiveCountdown(auc.data.rawStart, auc.data.rawDuration);
          if (newCountdown === auc.data.countdown) {
            // No change, return same object reference to prevent React.memo re-render
            return auc;
          }
          // Only update countdown, keep everything else the same
          return {
            ...auc,
            data: {
              ...auc.data,
              countdown: newCountdown
            }
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Memoize click handler to prevent new function reference on every render  
  const handleViewClick = useCallback((auctionId: string) => {
    console.log(`[LiveAuctionsPage] Opening modal for auction ${auctionId}`);
    setSelectedAuctionId(auctionId);
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    grade: "all",
  });
  const [sortBy, setSortBy] = useState("recent");

  // Filtering
  const filteredData = auctions.filter((auction) => {
    const title = auction.displayId || "";
    const grade = auction.data.grade || "";
    const basePrice = auction.data.price || 0;

    const query = filters.searchQuery?.toLowerCase() || "";
    const matchesSearch =
      !query ||
      title.toLowerCase().includes(query) ||
      grade.toLowerCase().includes(query);

    let matchesGrade = true;
    if (filters.grade && filters.grade !== "all") {
      matchesGrade = grade.toLowerCase() === filters.grade.toLowerCase();
    }

    let matchesPrice = true;
    if (filters.priceMin || filters.priceMax) {
      const price = typeof basePrice === "number" ? basePrice : parseInt(String(basePrice).replace(/[^\d]/g, ""));
      const min = filters.priceMin || 0;
      const max = filters.priceMax || Infinity;
      matchesPrice = price >= min && price <= max;
    }

    return matchesSearch && matchesGrade && matchesPrice;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    const basePrice_a = a.data.price || 0;
    const basePrice_b = b.data.price || 0;
    const priceA = typeof basePrice_a === "number" ? basePrice_a : parseInt(String(basePrice_a).replace(/[^\d]/g, "")) || 0;
    const priceB = typeof basePrice_b === "number" ? basePrice_b : parseInt(String(basePrice_b).replace(/[^\d]/g, "")) || 0;

    if (sortBy === "recent") {
      return new Date(b.data.rawStart || b.data.date).getTime() - new Date(a.data.rawStart || a.data.date).getTime();
    }
    if (sortBy === "price-high") {
      return priceB - priceA;
    }
    if (sortBy === "price-low") {
      return priceA - priceB;
    }
    if (sortBy === "ending-soon") {
      return new Date(a.data.rawStart || a.data.date).getTime() - new Date(b.data.rawStart || b.data.date).getTime();
    }
    return 0;
  });

  return (
    <div className="sm:px-4 lg:px-10 lg:pt-10 mb-10">
      <div className="mb-5 items-start">
        <h1 className="text-3xl font-bold text-[#1A2F1C]">Live Auctions</h1>
        <p className="text-muted-foreground mt-2">Monitor your ongoing auctions and watch live bids come in.</p>
      </div>

      <AuctionFilterSort
        hideStatus={true}
        onFilterChange={(f: FilterState) => setFilters(f)}
        onSortChange={(s: string) => setSortBy(s)}
      />

      {loading ? (
        <p className="text-gray-500">Loading live auctions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          {sortedData.length > 0 ? (
            sortedData.map((auction) => (
              <AuctionCard
                key={auction.id}
                auctionId={auction.id}
                type="live"
                id={auction.displayId}
                data={auction.data}
                onViewClick={() => setSelectedAuctionId(auction.id)}
              />
            ))
          ) : (
            <p className="text-gray-500 col-span-3 text-center">No live auctions happening right now.</p>
          )}
        </div>
      )}

      {/* Live Auction Modal */}
      {selectedAuctionId && (
        <LiveAuctionModal
          auctionId={selectedAuctionId}
          onClose={() => setSelectedAuctionId(null)}
        />
      )}
    </div>
  );
}