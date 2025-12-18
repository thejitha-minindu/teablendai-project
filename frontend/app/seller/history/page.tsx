"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AuctionCard } from '@/components/features/seller/AuctionCard';
import { HistoryAuctionModal } from '@/components/features/seller/AuctionModal';

export default function HistoryPage() {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  
  // Store the FULL ID instead of just a string, 
  // or use the ID to find the data later.
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  // Mock Data
  const historyAuctions = [1, 2, 3, 4, 5, 6].map((i) => ({
    id: `Auction ${i}`,
    data: {
      status: i % 3 === 0 ? 'Unsold' : 'Sold', // Auction 3 and 6 will be Unsold
      grade: i % 2 === 0 ? 'BOPF' : 'Dust-1',
      quantity: 750 + i * 50,
      price: 1450 + i * 100,
      buyer: 'Global Teas PLC'
    }
  }));

  // Helper to find the data for the selected ID
  const selectedAuctionData = historyAuctions.find(a => a.id === selectedAuctionId)?.data;

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
                  ? "border-[#8AA848] bg-[#F5F7EB] text-[#588157]" // Active Style (Your highlight)
                  : "border-gray-400 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-600" // Inactive Style
                }
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
      
      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {historyAuctions.map((auction) => (
          <AuctionCard 
            key={auction.id} 
            type="history" 
            id={auction.id} 
            data={auction.data}
            onViewClick={(id) => setSelectedAuctionId(id)}
          />
        ))}
      </div>

      {/* History Modal - NOW PASSING DATA */}
      {selectedAuctionId && selectedAuctionData && (
        <HistoryAuctionModal 
          auctionId={selectedAuctionId}
          data={selectedAuctionData} // <--- Passing the specific card data
          onClose={() => setSelectedAuctionId(null)} 
        />
      )}
    </div>
  );
}