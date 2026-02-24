"use client";

import React, { useState } from 'react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { LiveAuctionModal } from '@/components/features/seller/AuctionModal';

export default function LiveAuctionsPage() {
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);

  // Mock Data for Live Auctions
  const liveAuctions = [1, 2, 3, 4, 5, 6].map((i) => ({
    id: `Auction ${i}`,
    data: {
      price: 1200 + i * 25,
      grade: 'BOPF',
      quantity: 1000,
      buyer: `TeaMaster Ltd`,
      countdown: '00:15:30'
    }
  }));

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-[#1A2F1C] text-3xl font-bold text-left mb-12">
        Live Auction
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {liveAuctions.map((auction) => (
          <AuctionCard 
            key={auction.id} 
            type="live" 
            id={auction.id} 
            data={auction.data}
            onViewClick={(id) => setSelectedAuction(id)}
          />
        ))}
      </div>

      {/* Live Auction Modal */}
      {selectedAuction && (
        <LiveAuctionModal 
          auctionId={selectedAuction} 
          onClose={() => setSelectedAuction(null)} 
        />
      )}
    </div>
  );
}