"use client";

import React, { useState } from 'react';
// Import your local components
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { AuctionModal } from '@/components/features/seller/AuctionModal';

export default function ScheduledAuctionsPage() {
  // 1. Manage the "Selected Auction" state locally
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);

  // Mock Data
  const scheduledAuctions = [1, 2, 3, 4, 5, 6].map((i) => ({
    id: `Auction ${i}`,
    data: {
      price: 450 + i * 10,
      date: '2024-11-10',
      grade: i % 2 === 0 ? 'BOPF' : 'Dust-1',
      quantity: 500 + i * 50,
      time: '10:00 AM'
    }
  }));

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-[#1A2F1C] text-3xl font-bold text-center mb-12">
        Scheduled Auction
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {scheduledAuctions.map((auction) => (
          <AuctionCard 
            key={auction.id} 
            type="scheduled" 
            id={auction.id} 
            data={auction.data}
            // 2. Wired to local state
            onViewClick={(id) => setSelectedAuction(id)}
          />
        ))}
      </div>

      {/* 3. Render Modal when an auction is selected */}
      {selectedAuction && (
        <AuctionModal 
          auctionId={selectedAuction} 
          onClose={() => setSelectedAuction(null)} 
        />
      )}
    </div>
  );
}