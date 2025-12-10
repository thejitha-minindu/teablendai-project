"use client";
import React, { useState } from 'react';
import { Calendar, Clock, Package } from 'lucide-react';
import { AuctionCardProps } from '@/types/auction.types';

export function AuctionCard({ type, id, data, onViewClick }: AuctionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getPriceLabel = () => {
    if (type === 'live') return 'Highest Bid';
    if (type === 'history') return 'Final Price';
    return 'Base Price';
  };

  const getStatusColor = () => {
    if (type === 'history' && data.status === 'Sold') return 'text-green-600';
    if (type === 'live') return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div 
      className="bg-white p-6 rounded-2xl border-2 border-[#A3B18A] shadow-sm hover:shadow-2xl hover:border-[#588157] transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#588157] font-bold text-xl">{id}</h3>
          {type === 'live' && (
            <span className="animate-pulse bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">LIVE</span>
          )}
        </div>
        
        <div className="space-y-3 text-sm">
          {type === 'history' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-semibold">Status</span>
              <span className={`font-bold ${getStatusColor()}`}>{data.status}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-semibold">{getPriceLabel()}</span>
            <span className="text-[#588157] font-bold text-lg">${data.price}</span>
          </div>

          {type === 'scheduled' && data.date && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
              <span className="text-gray-800 font-medium">{data.date}</span>
            </div>
          )}

          {type === 'live' && data.buyer && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-semibold">Leading Buyer</span>
              <span className="text-blue-600 font-medium">{data.buyer}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-semibold flex items-center gap-2"><Package className="w-4 h-4" /> Grade</span>
            <span className="text-gray-800 font-medium">{data.grade}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-semibold">Quantity</span>
            <span className="text-gray-800 font-medium">{data.quantity} kg</span>
          </div>

          {type === 'history' && data.buyer && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-semibold">Buyer</span>
              <span className="text-gray-800 font-medium">{data.buyer}</span>
            </div>
          )}

          {type === 'scheduled' && data.time && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Time</span>
              <span className="text-gray-800 font-medium">{data.time}</span>
            </div>
          )}

          {type === 'live' && data.countdown && (
            <div className="flex justify-between items-center py-2 bg-red-50 px-3 rounded-lg">
              <span className="text-red-600 font-bold">Countdown</span>
              <span className="text-red-600 font-mono font-bold text-lg">{data.countdown}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-end border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-500 font-medium">
          <div>2024-11-10</div>
          <div>10:00 AM</div>
        </div>
        <button 
          onClick={() => onViewClick?.(id)}
          className={`bg-[#588157] text-white px-8 py-2.5 rounded-lg hover:bg-[#3A5A40] transition-all duration-300 font-bold shadow-md uppercase text-sm tracking-wide ${isHovered ? 'scale-105' : 'scale-100'}`}
        >
          View
        </button>
      </div>
    </div>
  );
}