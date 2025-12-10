"use client";
import React from 'react';
import { X, Package } from 'lucide-react';

interface AuctionModalProps {
  auctionId: string;
  onClose: () => void;
}

export function AuctionModal({ auctionId, onClose }: AuctionModalProps) {
  const bids = [1, 2, 3, 4, 5].map(i => ({
    id: i,
    buyer: `Buyer ${i}`,
    time: `${10 + i}:${30 + i} AM`,
    amount: 1000 + i * 50
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#1A2F1C]">{auctionId}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-gray-100 h-48 rounded-xl flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b"><span className="font-semibold text-gray-600">Estate Name:</span><span className="text-gray-800">Premium Estate</span></div>
                <div className="flex justify-between py-2 border-b"><span className="font-semibold text-gray-600">Grade:</span><span className="text-gray-800">BOPF</span></div>
                <div className="flex justify-between py-2 border-b"><span className="font-semibold text-gray-600">Quantity:</span><span className="text-gray-800">1000 kg</span></div>
                <div className="flex justify-between py-2 border-b"><span className="font-semibold text-gray-600">Final Price:</span><span className="text-[#588157] font-bold text-xl">$1,450</span></div>
              </div>
              <div className="text-xs text-gray-500 mt-4">2024-11-10 • 10:00 AM - 12:00 PM</div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-700">Bid History</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bids.map((bid) => (
                  <div key={bid.id} className="bg-[#F5F7EB] p-4 rounded-lg hover:bg-[#ECF3E0] transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-[#588157]">Bid {bid.id}</span>
                      <span className="text-green-600 font-bold">${bid.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Bid By: {bid.buyer}</span>
                      <span>Bid Time: {bid.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}