"use client";

import React, { useState, useEffect } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { LiveAuctionModal } from '@/components/features/seller/AuctionModal';
import { apiClient } from '@/lib/apiClient';

const parseBackendDateTime = (dateString: string) => {
  if (!dateString) return null;

  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  const normalized = dateString.replace(' ', 'T');
  const [datePart, timePartRaw = '00:00:00'] = normalized.split('T');
  const timePart = timePartRaw.split('.')[0];

  const [year, month, day] = datePart.split('-').map(Number);
  const [hours = '0', minutes = '0', seconds = '0'] = timePart.split(':');

  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
};

const durationToMinutes = (durationValue: number) => {
  if (!Number.isFinite(durationValue) || durationValue <= 0) return 0;
  return durationValue > 24 ? durationValue : durationValue * 60;
};

// Helper to calculate time remaining
const calculateCountdown = (startTime: string, durationValue: number) => {
  const startDate = parseBackendDateTime(startTime);
  if (!startDate || Number.isNaN(startDate.getTime())) return "Closing...";

  const start = startDate.getTime();
  const durationMinutes = durationToMinutes(durationValue);
  const end = start + (durationMinutes * 60 * 1000);
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
          custom_auction_id: item.custom_auction_id,
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