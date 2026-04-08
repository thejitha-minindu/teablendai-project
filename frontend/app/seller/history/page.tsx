"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { HistoryAuctionModal } from '@/components/features/seller/AuctionModal';
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
  const [sortBy, setSortBy] = useState('date');
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

  // 2. Sorting Logic
  const sortedAuctions = useMemo(() => {
    const sorted = [...auctions];
    
    sorted.sort((a, b) => {
      if (sortBy === 'date') {
        // Newest first
        return b.data.dateObj.getTime() - a.data.dateObj.getTime();
      } 
      else if (sortBy === 'price') {
        // Highest price first
        return b.data.price - a.data.price;
      } 
      else if (sortBy === 'status') {
        // Alphabetical: "Sold" comes before "Unsold"
        return a.data.status.localeCompare(b.data.status);
      }
      return 0;
    });

    return sorted;
  }, [auctions, sortBy]);

  // Find specific data for modal
  const selectedAuctionData = sortedAuctions.find(a => a.id === selectedAuctionId)?.data;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-[#1A2F1C] text-3xl font-bold text-left mb-8">
        Auction History
      </h1>
      
      {/* Sorting Buttons */}
      <div className="flex justify-start items-center mb-8 gap-3">
        {['Date', 'Price', 'Status'].map((option) => {
          const value = option.toLowerCase();
          const isActive = sortBy === value;

          return (
            <button
              key={option}
              onClick={() => setSortBy(value)}
              className={`
                px-6 py-2.5 rounded-xl font-bold border-2 transition-all duration-200
                ${isActive 
                  ? "border-[#8AA848] bg-[#F5F7EB] text-[#588157]" 
                  : "border-gray-400 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-600" 
                }
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
      
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