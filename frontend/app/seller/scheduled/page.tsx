"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { ScheduledAuctionModal } from '@/components/features/seller/AuctionModal';
import { AuctionFilterSort, FilterState } from "@/components/features/buyer/AuctionFilterSort";
import { apiClient } from '@/lib/apiClient';

interface AuctionAPIResponse {
  auction_id: string;
  custom_auction_id?: string;
  grade: string;
  quantity: number;
  base_price: number;
  start_time: string;
  description: string;
  origin: string;
  duration: number;
  image_url?: string;
}

import { parseBackendDateTime, calculateTimeUntilStart } from "@/utils/dateFormatter";
import { getUserFromToken } from "@/utils/auth";

function ScheduledAuctionsContent() {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // 1. Fetch Data Function
  const fetchAuctions = async () => {
    try {
      // Decode the token to get YOUR specific user ID
      const payload = getUserFromToken();
      if (!payload || !payload.id) {
        setLoading(false);
        return;
      }
      const myUserId = payload.id; 

      // Use apiClient and attach the seller_id to the URL
      const res = await apiClient.get(`/auctions/status/scheduled?seller_id=${myUserId}`, {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      
      const data: AuctionAPIResponse[] = res.data;

      // 2. Map API Data to Card Format
      const formattedData = data.map((item) => {
        const dateObj = parseBackendDateTime(item.start_time) || new Date();

        return {
          id: item.auction_id,
          displayId: `${item.grade} - ${item.origin}`,
          // Store raw start time for the live timer updates
          rawStart: item.start_time,
          data: {
            price: item.base_price,
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            grade: item.grade,
            quantity: item.quantity,
            custom_auction_id: item.custom_auction_id,
            image_url: item.image_url,
            // Calculate initial countdown
            countdown: calculateTimeUntilStart(item.start_time),
            fullData: item
          }
        };
      });

      setAuctions(formattedData);
    } catch (error) {
      console.error("Error loading auctions:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // 3. Load on Mount
  useEffect(() => {
    fetchAuctions();
  }, []);

  // 4. Live Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setAuctions(prevAuctions => {
        // Check if any auction just started
        const hasStarted = prevAuctions.some(auc => {
          const countdown = calculateTimeUntilStart(auc.rawStart);
          return countdown === "Starting...";
        });

        // If an auction is starting, trigger a data fetch to sync with backend
        if (hasStarted) {
          fetchAuctions();
        }

        return prevAuctions.map(auc => ({
          ...auc,
          data: {
            ...auc.data,
            countdown: calculateTimeUntilStart(auc.rawStart)
          }
        }));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const auctionIdFromQuery = searchParams.get('auctionId');
    if (!auctionIdFromQuery || auctions.length === 0) return;

    const auctionExists = auctions.some((auction) => auction.id === auctionIdFromQuery);
    if (auctionExists) {
      setSelectedAuctionId(auctionIdFromQuery);
    }
  }, [searchParams, auctions]);
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
      const gradeMap: Record<string, string[]> = {
        A: ["FTGFOP1", "SFTGFOP", "Silver Needle"],
        B: ["BOP", "OP", "FBOP", "TGFOP"],
        C: ["Herbal"],
      };
      matchesGrade = gradeMap[filters.grade]?.includes(grade) || false;
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
      return new Date(b.rawStart || b.data.date).getTime() - new Date(a.rawStart || a.data.date).getTime();
    }
    if (sortBy === "price-high") {
      return priceB - priceA;
    }
    if (sortBy === "price-low") {
      return priceA - priceB;
    }
    if (sortBy === "ending-soon") {
      return new Date(a.rawStart || a.data.date).getTime() - new Date(b.rawStart || b.data.date).getTime();
    }
    return 0;
  });

  return (
    <div className="sm:px-4 lg:px-10 lg:pt-10 mb-10">
      <div className="mb-5 items-start">
        <h1 className="text-3xl font-bold text-[#1A2F1C]">Scheduled Auctions</h1>
        <p className="text-muted-foreground mt-2">Manage and review your upcoming tea lot listings before they go live.</p>
      </div>

      <AuctionFilterSort
        hideStatus={true}
        onFilterChange={(f: FilterState) => setFilters(f)}
        onSortChange={(s: string) => setSortBy(s)}
      />

      {loading ? (
        <p>Loading auctions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          {sortedData.map((auction) => (
            <AuctionCard
              key={auction.id}
              auctionId={auction.id}
              type="scheduled"
              id={auction.displayId}
              data={auction.data}
              onViewClick={() => setSelectedAuctionId(auction.id)}
            />
          ))}
          {sortedData.length === 0 && <p>No scheduled auctions found.</p>}
        </div>
      )}

      {/* Modal */}
      {selectedAuctionId && (
        <ScheduledAuctionModal
          auctionId={selectedAuctionId}
          onClose={() => {
            setSelectedAuctionId(null);
            fetchAuctions();
          }}
        />
      )}
    </div>
  );
}

import { Suspense as ReactSuspense } from "react";

export default function ScheduledAuctionsPage() {
  return (
    <ReactSuspense fallback={<div>Loading...</div>}>
      <ScheduledAuctionsContent />
    </ReactSuspense>
  );
}