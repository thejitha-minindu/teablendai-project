"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { ScheduledAuctionModal } from '@/components/features/seller/AuctionModal';
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
}

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

// Helper to calculate time remaining until start
const calculateTimeUntilStart = (startTime: string) => {
  const startDate = parseBackendDateTime(startTime);
  if (!startDate || Number.isNaN(startDate.getTime())) return "Starting...";

  const start = startDate.getTime();
  const now = new Date().getTime();
  const diff = start - now;

  if (diff <= 0) return "Starting...";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
};

export default function ScheduledAuctionsPage() {
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  // 1. Fetch Data Function
  const fetchAuctions = async () => {
    try {
      // Decode the token to get YOUR specific user ID
      const token = typeof window !== 'undefined' ? localStorage.getItem("teablend_token") : null;
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
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
              auctionId={auction.id}
              type="scheduled" // You might need to check if AuctionCard supports displaying countdown for 'scheduled' type
              id={auction.displayId}
              data={auction.data} // data.countdown is now populated
              onViewClick={() => setSelectedAuctionId(auction.id)}
            />
          ))}
          {auctions.length === 0 && <p>No scheduled auctions found.</p>}
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