"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react'; 
import '../../../app/globals.css';
import { useAuctionBidsSocket } from '@/hooks/live-auction-socket'; 

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

// We define exactly what the component should accept here, using 'any' for data to bypass the TS errors
interface ExtendedAuctionCardProps {
  type: string;
  id: string;
  data: any; 
  onViewClick?: (id: string) => void;
  auctionId?: string;
}

export function AuctionCard({ type, id, data, onViewClick, auctionId }: ExtendedAuctionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // --- REAL-TIME WEBSOCKET STATE ---
  const { connected, events } = useAuctionBidsSocket(type === 'live' && auctionId ? auctionId : "");
  
  const [livePrice, setLivePrice] = useState<number>(data.price);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      if (latestEvent.event_type === "BID_CREATED") {
        setLivePrice(latestEvent.data.bid_amount);
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 800);
      }
    }
  }, [events]);

  const displayPrice = events.length > 0 ? livePrice : data.price;
  
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

  return (
    <Card 
      className={`w-full mx-auto hover:shadow-lg transition-all duration-300 ${isFlashing ? 'ring-4 ring-green-400 bg-green-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#588157] text-xl">{id}</CardTitle>
            {type === 'live' && (
              <Badge variant="destructive" className="animate-pulse flex gap-1 items-center">
                LIVE {connected && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
              </Badge>
            )}
          </div>
          <CardDescription>{data.grade} Grade</CardDescription>
        </div>

        <div className="flex flex-col items-start sm:items-end text-sm text-muted-foreground">
          {/* Ensure date is rendered as a string safely */}
          <p>{String(data.date || "Date N/A")}</p>
          {data.time && <p>{String(data.time)}</p>}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-medium text-muted-foreground">{getPriceLabel()}:</span>
                 <span className={`text-lg font-bold transition-colors duration-300 ${isFlashing ? 'text-green-600 scale-110 transform' : 'text-[#1A2F1C]'}`}>
                    LKR {displayPrice}
                 </span>
            </div>

            <p className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Quantity:</span>
                <span>{data.quantity} kg</span>
            </p>

            {type === 'history' && (
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <span className={`font-bold ${getStatusColor()}`}>{data.status}</span>
                </p>
            )}

            {(type === 'live' || type === 'history') && (events.length > 0 || data.buyer) && (
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">{type === 'live' ? 'Leading Buyer:' : 'Winner:'}</span>
                    <span className="text-blue-600 font-medium">
                      {events.length > 0 ? events[0].data.buyer_id.substring(0, 8) + "..." : data.buyer}
                    </span>
                </p>
            )}

            {(type === 'live' || type === 'scheduled') && data.countdown && (
                <div className={`mt-2 p-2 rounded-md flex justify-between items-center ${
                    type === 'live' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
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

      <CardFooter className="flex justify-end pt-2">
        <Button 
            onClick={() => onViewClick?.(id)}
            className="bg-[#E5F7CB] hover:bg-[#3A5A40] text-[#3A5A40] hover:text-white font-bold transition-colors"
        >
            View Details
        </Button>
      </CardFooter>
    </Card>
  );
}