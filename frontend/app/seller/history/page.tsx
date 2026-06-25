"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { HistoryAuctionModal } from '@/components/features/seller/AuctionModal';
import { AuctionFilterSort, FilterState } from "@/components/features/buyer/AuctionFilterSort";
import { apiClient } from '@/lib/apiClient';

// Helper: Parse backend ISO datetimes safely (reusing from dashboard)
const parseBackendDateTime = (dateString?: string | null): Date | null => {
  if (!dateString) return null;
  if (/.*T.*([+-]\d{2}:\d{2}|Z)$/.test(dateString)) {
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const normalized = dateString.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const [datePart, timePart = '00:00:00'] = normalized.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = '0', minute = '0', second = '0'] = timePart.split(':');
  const manual = new Date(year, (month || 1) - 1, day || 1, Number(hour), Number(minute), Number(second));
  return Number.isNaN(manual.getTime()) ? null : manual;
};

export default function HistoryPage() {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  
  // Real Data States
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real History Data
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem("teablend_token") : null;
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        const myUserId = payload.id;

        const res = await apiClient.get(`/auctions/status/history?seller_id=${myUserId}`);
        
        const formattedData = res.data.map((item: any) => {
          const dateObj = parseBackendDateTime(item.start_time) || new Date();
          
          // Determine if it was actually sold
          const isSold = item.status?.toLowerCase() === 'sold' || item.buyer;
          const displayStatus = isSold ? 'Sold' : 'Unsold';

          return {
            id: item.auction_id,
            displayId: `${item.grade} - ${item.origin}`,
            data: {
              price: item.highest_bid ?? item.sold_price ?? item.base_price,
              grade: item.grade,
              quantity: item.quantity,
              status: displayStatus,
              buyer: item.highest_bidder ?? item.buyer_name ?? item.buyer,
              dateObj: dateObj,
              date: dateObj.toLocaleDateString(),
              time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              image_url: item.image_url
            }
          };
        });

        setAuctions(formattedData);
      } catch (error) {
        console.error("Failed to load history auctions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
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
  const sortedAuctions = [...filteredData].sort((a, b) => {
    const basePrice_a = a.data.price || 0;
    const basePrice_b = b.data.price || 0;
    const priceA = typeof basePrice_a === "number" ? basePrice_a : parseInt(String(basePrice_a).replace(/[^\d]/g, "")) || 0;
    const priceB = typeof basePrice_b === "number" ? basePrice_b : parseInt(String(basePrice_b).replace(/[^\d]/g, "")) || 0;

    if (sortBy === "recent") {
      return b.data.dateObj.getTime() - a.data.dateObj.getTime();
    }
    if (sortBy === "price-high") {
      return priceB - priceA;
    }
    if (sortBy === "price-low") {
      return priceA - priceB;
    }
    if (sortBy === "ending-soon") {
      return a.data.dateObj.getTime() - b.data.dateObj.getTime();
    }
    return 0;
  });

  // Find specific data for modal
  const selectedAuctionData = sortedAuctions.find(a => a.id === selectedAuctionId)?.data;

  return (
    <div className="sm:px-4 lg:px-10 lg:pt-10 mb-10">
      <div className="mb-5 items-start">
        <h1 className="text-3xl font-bold text-[#1A2F1C]">Auction History</h1>
        <p className="text-muted-foreground mt-2">Review your past auctions, winning bids, and complete sales records.</p>
      </div>
      
      <AuctionFilterSort
        hideStatus={true}
        onFilterChange={(f: FilterState) => setFilters(f)}
        onSortChange={(s: string) => setSortBy(s)}
      />
      
      {/* Grid of Cards */}
      {loading ? (
        <p className="text-gray-500 animate-pulse">Loading historical records...</p>
      ) : sortedAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedAuctions.map((auction) => (
            <AuctionCard 
              key={auction.id} 
              auctionId={auction.id}
              type="history" 
              id={auction.displayId} 
              data={auction.data}
              onViewClick={() => setSelectedAuctionId(auction.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-500 font-medium">You don't have any past auctions yet.</p>
        </div>
      )}

      {/* History Modal */}
      {selectedAuctionId && selectedAuctionData && (
        <HistoryAuctionModal 
          auctionId={selectedAuctionId}
          data={selectedAuctionData} 
          onClose={() => setSelectedAuctionId(null)} 
        />
      )}
    </div>
  );
}