"use client";

import React, { useState, useEffect } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { LiveAuctionModal } from '@/components/features/seller/AuctionModal';
import { apiClient } from '@/lib/apiClient';

// Helper to calculate time remaining
const calculateCountdown = (startTime: string, durationHours: number) => {
  const safeStartTime = startTime.endsWith('Z') ? startTime : startTime + 'Z';
  const start = new Date(safeStartTime).getTime();
  const end = start + (durationHours * 60 * 60 * 1000);
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return "Closing...";

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function LiveAuctionsPage() {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Live Auctions (Added cache busting)
  const fetchLiveAuctions = async () => {
    try {
      // Decode the token to get YOUR specific user ID
      const token = typeof window !== 'undefined' ? localStorage.getItem("teablend_token") : null;
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const myUserId = payload.id; 

      // Use apiClient and attach the seller_id to the URL
      const res = await apiClient.get(`/auctions/status/live?seller_id=${myUserId}`, {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      
      const data = res.data; // Axios puts the JSON in .data

      const formattedData = data.map((item: any) => ({
        id: item.auction_id,
        displayId: `${item.grade} - ${item.origin}`,
        data: {
          price: item.base_price, 
          grade: item.grade,
          quantity: item.quantity,
          buyer: item.buyer || "No Bids Yet",
          countdown: calculateCountdown(item.start_time, item.duration),
          rawStart: item.start_time,
          rawDuration: item.duration
        }
      }));

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
            const status = calculateCountdown(auc.data.rawStart, auc.data.rawDuration);
            return status === "Closing...";
        });

        if (shouldReload) {
            console.log("Auction ended. Refreshing list...");
            fetchLiveAuctions(); // Reload from backend to remove the expired item
        }
        // ---------------------------------------------

        return prevAuctions.map(auc => ({
          ...auc,
          data: {
            ...auc.data,
            countdown: calculateCountdown(auc.data.rawStart, auc.data.rawDuration)
          }
        }));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-[#1A2F1C] text-3xl font-bold text-left mb-12">
        Live Auctions
      </h1>
      
      {loading ? (
        <p className="text-gray-500">Loading live auctions...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.length > 0 ? (
            auctions.map((auction) => (
              <AuctionCard 
                key={auction.id} 
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