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
      <h1 className="text-[#1A2F1C] text-3xl font-bold text-center mb-8">
        Auction History
      </h1>
      
      {/* Sorting Dropdown */}
      <div className="flex justify-start mb-8 relative">
        <button 
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-2 border-2 border-[#8AA848] text-[#588157] font-bold px-6 py-3 rounded-xl bg-[#F5F7EB] hover:bg-[#ECF3E0] transition-all duration-200"
        >
          SORT <ChevronDown className={`w-5 h-5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {sortOpen && (
          <div className="absolute top-14 left-0 bg-white border-2 border-[#8AA848] rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in">
            {['Date', 'Price', 'Status'].map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSortBy(option.toLowerCase());
                  setSortOpen(false);
                }}
                className="block w-full text-left px-6 py-3 hover:bg-[#F5F7EB] transition-colors font-semibold text-gray-700"
              >
                {option}
              </button>
            ))}
          </div>
        )}
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