"use client";
import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react'; 
import { AuctionCardProps } from '@/types/auction.types';
import '../../../app/globals.css';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 

export function AuctionCard({ type, id, data, onViewClick }: AuctionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // --- EXISTING LOGIC PRESERVED ---
  const getPriceLabel = () => {
    if (type === 'live') return 'Highest Bid';
    if (type === 'history') return 'Final Price';
    return 'Base Price';
  };

  const getStatusColor = () => {
    if (type === 'history' && data.status === 'Sold') return 'text-green-600';
    if (type === 'live') return 'text-blue-600';
    return 'text-muted-foreground';
  };
  // -------------------------------

  return (
    <Card 
      className="w-full mx-auto hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. HEADER: Title (ID) & Date/Time */}
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* Title / ID */}
            <CardTitle className="text-[#588157] text-xl">{id}</CardTitle>
            
            {/* LIVE Badge (Preserved Logic) */}
            {type === 'live' && (
              <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
            )}
          </div>
          <CardDescription>
             {/* Using Grade as subtitle since Estate is usually implied in Seller Dashboard */}
             {data.grade} Grade
          </CardDescription>
        </div>

        {/* Date & Time (Moved from bottom to top-right to match Buyer Card) */}
        <div className="flex flex-col items-start sm:items-end text-sm text-muted-foreground">
          <p>{data.date || "Date N/A"}</p>
          {data.time && <p>{data.time}</p>}
        </div>
      </CardHeader>

      {/* 2. CONTENT: Data Fields */}
      <CardContent>
        <div className="flex flex-col gap-2">
            
            {/* Price (Highlighted) */}
            <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-medium text-muted-foreground">{getPriceLabel()}:</span>
                 <span className="text-lg font-bold text-[#1A2F1C]">LKR {data.price}</span>
            </div>

            {/* Quantity */}
            <p className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Quantity:</span>
                <span>{data.quantity} kg</span>
            </p>

            {/* Status (History only) */}
            {type === 'history' && (
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <span className={`font-bold ${getStatusColor()}`}>{data.status}</span>
                </p>
            )}

            {/* Buyer (Live/History only) */}
            {(type === 'live' || type === 'history') && data.buyer && (
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">{type === 'live' ? 'Leading Buyer:' : 'Winner:'}</span>
                    <span className="text-blue-600 font-medium">{data.buyer}</span>
                </p>
            )}

            {/* Countdown (Live OR Scheduled) - UPDATED SECTION */}
            {(type === 'live' || type === 'scheduled') && data.countdown && (
                <div className={`mt-2 p-2 rounded-md flex justify-between items-center ${
                    type === 'live' 
                        ? 'bg-red-50 text-red-600' // Red for LIVE urgency
                        : 'bg-blue-50 text-blue-600' // Blue for Scheduled countdown
                }`}>
                    <span className="text-xs font-bold uppercase">
                        {type === 'live' ? 'Ending In' : 'Starts In'}
                    </span>
                    <span className="text-sm font-mono font-bold">
                        {data.countdown}
                    </span>
                </div>
            )}
        </div>
      </CardContent>

      {/* 3. FOOTER: Action Button */}
      <CardFooter className="flex justify-end pt-2">
        <Button 
            onClick={() => onViewClick?.(id)}
            className="bg-[var(--color1)] hover:bg-[var(--color3)] hover:text-white text-black font-bold"
        >
            View Details
        </Button>
      </CardFooter>
    </Card>
  );
}