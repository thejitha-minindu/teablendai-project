"use client";

import React, { useState, useEffect } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { ScheduledAuctionModal } from '@/components/features/seller/AuctionModal';

// Define the shape of data coming from your API
interface AuctionAPIResponse {
  auction_id: string;
  grade: string;
  quantity: number;
  base_price: number;
  start_time: string;
  description: string;
  origin: string;
  duration: number;
}

export default function ScheduledAuctionsPage() {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data Function
  const fetchAuctions = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auctions/status/scheduled');
      if (!res.ok) throw new Error("Failed to fetch");
      const data: AuctionAPIResponse[] = await res.json();

      // 2. Map API Data to Card Format
      const formattedData = data.map((item) => {
        const dateObj = new Date(item.start_time);
        return {
          id: item.auction_id, // Keep the real ID for API calls
          displayId: `Auction #${item.auction_id.substring(0, 8)}`, // Short visual ID
          data: {
            price: item.base_price,
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            grade: item.grade,
            quantity: item.quantity,
            // Pass full data for the modal to use in 'Edit'
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

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-[#1A2F1C] text-3xl font-bold text-left mb-12">
        Scheduled Auctions
      </h1>
      
      {loading ? (
        <p>Loading auctions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.map((auction) => (
            <AuctionCard 
              key={auction.id} 
              type="scheduled" 
              id={auction.displayId} // Visual ID
              data={auction.data}
              onViewClick={() => setSelectedAuctionId(auction.id)} // Pass REAL ID to modal
            />
          ))}
          {auctions.length === 0 && <p>No scheduled auctions found.</p>}
        </div>
      )}

      {/* 4. Scheduled Auction Modal with Refresh Callback */}
      {selectedAuctionId && (
        <ScheduledAuctionModal 
          auctionId={selectedAuctionId} 
          onClose={() => {
            setSelectedAuctionId(null);
            fetchAuctions(); // Refresh list after Edit/Cancel
          }} 
        />
      )}
    </div>
  );
}