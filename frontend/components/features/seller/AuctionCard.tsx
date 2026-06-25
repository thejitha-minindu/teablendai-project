"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, TrendingUp, Package } from 'lucide-react'; 
import '../../../app/globals.css';
import { useAuctionBidsSocket } from '@/hooks/live-auction-socket'; 
import { apiClient } from '@/lib/apiClient';

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

interface ExtendedAuctionCardProps {
  type: string;
  id: string;
  data: any; 
  onViewClick?: () => void;
  auctionId?: string;
}

function AuctionCardInner({ type, id, data, onViewClick, auctionId }: ExtendedAuctionCardProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const validAuctionId = useMemo(() => {
    if (type === 'live' && auctionId) return String(auctionId).trim();
    return "";
  }, [type, auctionId]);
  
  const { connected, events } = useAuctionBidsSocket(validAuctionId);
  
  // --- 1. SEPARATE STATE FOR FETCHED vs WEBSOCKET DATA ---
  const [wsPrice, setWsPrice] = useState<number | null>(null);
  const [wsBuyer, setWsBuyer] = useState<string | null>(null);
  
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);
  const [fetchedBuyer, setFetchedBuyer] = useState<string | null>(null);
  const [isLoadingBids, setIsLoadingBids] = useState<boolean>(type === 'live' || type === 'history');

  // --- 2. FETCH EXISTING BIDS ON LOAD ---
  useEffect(() => {
    const fetchExistingBids = async () => {
      if ((type !== 'live' && type !== 'history') || !auctionId) {
          setIsLoadingBids(false);
          return;
      }
      
      try {
        setIsLoadingBids(true);
        const res = await apiClient.get(`/buyer/bids/auction/${auctionId}/bids`);
        const bidsArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        if (bidsArray.length > 0) {
          const highestBid = bidsArray.reduce((max: any, bid: any) => 
            bid.bid_amount > max.bid_amount ? bid : max
          , bidsArray[0]);
          
          setFetchedPrice(highestBid.bid_amount);
          setFetchedBuyer(highestBid.buyer_name || highestBid.buyer_id);
        }
      } catch (err) {
        console.error(`Card ${auctionId} failed to fetch initial bids`, err);
      } finally {
        setIsLoadingBids(false);
      }
    };

    fetchExistingBids();
  }, [auctionId, type]);

  // --- 3. LISTEN FOR NEW WEBSOCKET BIDS ---
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      
      if (latestEvent.event_type === "BID_CREATED") {
        const newBuyerId = latestEvent.data.buyer_name || latestEvent.data.buyer_id;
        setWsPrice(latestEvent.data.bid_amount);
        if (newBuyerId) setWsBuyer(newBuyerId);
        
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 800);
      }

      if (latestEvent.event_type === "AUCTION_WON" || latestEvent.event_type === "AUCTION_CLOSED") {
        const winner = latestEvent.data.winner_id || latestEvent.data.buyer_name || latestEvent.data.buyer_id;
        if (winner) setWsBuyer(winner);
      }
    }
  }, [events]);

  // --- 4. THE ULTIMATE FALLBACK CHAIN ---
  // Priority: 1. Live WS Bid -> 2. Fetched DB Bid -> 3. Passed Highest Bid -> 4. Passed Sold Price -> 5. Base Price
  const displayPrice = wsPrice ?? fetchedPrice ?? data.highest_bid ?? data.sold_price ?? data.price;
  
  const rawBuyer = wsBuyer ?? fetchedBuyer ?? data.highest_bidder ?? data.buyer_name ?? data.buyer ?? (isLoadingBids ? "WAITING" : "No Bids Yet");

  // Safely format the buyer without crashing if it's null
  const safeBuyerDisplay = useMemo(() => {
    if (rawBuyer === "WAITING") return <span className="animate-pulse">Loading bids...</span>;
    if (!rawBuyer || rawBuyer === "No Bids Yet") return "No bids yet";
    
    const str = String(rawBuyer); // Force to string just in case
    if (str.includes('@')) return str.split('@')[0];
    return str.length > 20 ? str.substring(0, 20) + "..." : str;
  }, [rawBuyer]);

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
<<<<<<< HEAD
<<<<<<< HEAD
      className={`w-full mx-auto h-full hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden border-gray-100 p-0 gap-0 flex flex-col ${isFlashing ? 'ring-2 ring-green-400 bg-green-50' : 'bg-white'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-[200px] overflow-hidden bg-gray-50 flex items-center justify-center m-0 shrink-0">
=======
      className={`w-full mx-auto hover:shadow-lg transition-all duration-300 ${isFlashing ? 'ring-4 ring-green-400 bg-green-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-40 overflow-hidden bg-gray-50 border-b border-gray-100 rounded-t-xl flex items-center justify-center">
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
      className={`w-full mx-auto hover:shadow-lg transition-all duration-300 ${isFlashing ? 'ring-4 ring-green-400 bg-green-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-40 overflow-hidden bg-gray-50 border-b border-gray-100 rounded-t-xl flex items-center justify-center">
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
        {data.image_url ? (
          <img src={data.image_url} alt="Tea Lot" className="w-full h-full object-cover" />
        ) : (
          <Package className="w-16 h-16 text-gray-300" />
        )}
      </div>
<<<<<<< HEAD
<<<<<<< HEAD
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4 pb-4 pt-5 px-5 border-b border-gray-100 shrink-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-gray-900 text-xl font-semibold">{id}</CardTitle>
            {type === 'live' && (
              <Badge variant="destructive" className="animate-pulse flex gap-1 items-center text-white font-semibold bg-red-600">
=======
=======
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4 pb-2 pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#588157] text-xl">{id}</CardTitle>
            {type === 'live' && (
              <Badge variant="destructive" className="animate-pulse flex gap-1 items-center">
<<<<<<< HEAD
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
                LIVE {connected && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
              </Badge>
            )}
          </div>
<<<<<<< HEAD
<<<<<<< HEAD
          <p className="text-gray-700 font-normal text-sm">{data.grade} Grade</p>
        </div>

        <div className="flex flex-col items-start sm:items-end text-sm text-gray-600 shrink-0">
          <p className="font-normal">{String(data.date || "Date N/A")}</p>
          {data.time && <p className="font-normal">{String(data.time)}</p>}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 pt-4 flex-grow">
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-1">
                 <span className="text-sm font-normal text-gray-500">{getPriceLabel()}:</span>
                 <span className={`text-lg font-semibold transition-colors duration-300 ${isFlashing ? 'text-green-600' : 'text-gray-900'}`}>
=======
          <CardDescription>{data.grade} Grade</CardDescription>
        </div>

        <div className="flex flex-col items-start sm:items-end text-sm text-muted-foreground">
          <p>{String(data.date || "Date N/A")}</p>
          {data.time && <p>{String(data.time)}</p>}
        </div>
      </CardHeader>

=======
          <CardDescription>{data.grade} Grade</CardDescription>
        </div>

        <div className="flex flex-col items-start sm:items-end text-sm text-muted-foreground">
          <p>{String(data.date || "Date N/A")}</p>
          {data.time && <p>{String(data.time)}</p>}
        </div>
      </CardHeader>

>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
      <CardContent>
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-medium text-muted-foreground">{getPriceLabel()}:</span>
                 <span className={`text-lg font-bold transition-colors duration-300 ${isFlashing ? 'text-green-600 scale-110 transform' : 'text-[#1A2F1C]'}`}>
<<<<<<< HEAD
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
                    LKR {displayPrice} 
                 </span>
            </div>

<<<<<<< HEAD
<<<<<<< HEAD
            <p className="flex justify-between text-sm items-center">
                <span className="font-normal text-gray-500">Quantity:</span>
                <span className="font-medium text-gray-800">{data.quantity} kg</span>
            </p>

            {type === 'history' && (
                <p className="flex justify-between text-sm items-center">
                    <span className="font-normal text-gray-500">Status:</span>
                    <span className={`font-medium ${rawBuyer !== "No Bids Yet" ? 'text-gray-800' : 'text-gray-500'}`}>
=======
            <p className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Quantity:</span>
                <span>{data.quantity} kg</span>
            </p>

            {type === 'history' && (
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <span className={`font-bold ${rawBuyer !== "No Bids Yet" ? 'text-green-600' : 'text-red-600'}`}>
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
            <p className="flex justify-between text-sm">
                <span className="font-medium text-muted-foreground">Quantity:</span>
                <span>{data.quantity} kg</span>
            </p>

            {type === 'history' && (
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Status:</span>
                    <span className={`font-bold ${rawBuyer !== "No Bids Yet" ? 'text-green-600' : 'text-red-600'}`}>
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
                        {rawBuyer !== "No Bids Yet" ? 'Sold' : 'Unsold'}
                    </span>
                </p>
            )}

            {(type === 'live' || type === 'history') && (
<<<<<<< HEAD
<<<<<<< HEAD
                <p className="flex justify-between text-sm items-center">
                    <span className="font-normal text-gray-500">{type === 'live' ? 'Leading Buyer:' : 'Winner:'}</span>
                    <span className={`font-medium ${(rawBuyer === "WAITING" || rawBuyer === "No Bids Yet") ? 'text-gray-400' : 'text-gray-800'}`}>
=======
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">{type === 'live' ? 'Leading Buyer:' : 'Winner:'}</span>
                    <span className={`font-medium ${(rawBuyer === "WAITING" || rawBuyer === "No Bids Yet") ? 'text-gray-500' : 'text-blue-600'}`}>
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
                <p className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground">{type === 'live' ? 'Leading Buyer:' : 'Winner:'}</span>
                    <span className={`font-medium ${(rawBuyer === "WAITING" || rawBuyer === "No Bids Yet") ? 'text-gray-500' : 'text-blue-600'}`}>
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
                      {safeBuyerDisplay}
                    </span>
                </p>
            )}

            {(type === 'live' || type === 'scheduled') && data.countdown && (
<<<<<<< HEAD
<<<<<<< HEAD
                <div className={`mt-2 p-2.5 rounded-lg flex justify-between items-center ${
                    type === 'live' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                }`}>
                    <span className="text-xs font-medium uppercase tracking-wider">
=======
=======
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
                <div className={`mt-2 p-2 rounded-md flex justify-between items-center ${
                    type === 'live' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                    <span className="text-xs font-bold uppercase">
<<<<<<< HEAD
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
                        {type === 'live' ? 'Ending In' : 'Starts In'}
                    </span>
                    <span className="text-sm font-mono font-medium">
                        {data.countdown}
                    </span>
                </div>
            )}
        </div>
      </CardContent>

<<<<<<< HEAD
<<<<<<< HEAD
      <CardFooter className="flex justify-center pb-5 pt-2 px-5 shrink-0">
=======
      <CardFooter className="flex justify-end pt-2">
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
      <CardFooter className="flex justify-end pt-2">
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
        <Button 
            variant="outline"
            style={{ transition: "background 0.2s" }}
            className="w-full hover:text-white hover:cursor-pointer"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3A5A40")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            onClick={() => onViewClick?.()}
<<<<<<< HEAD
<<<<<<< HEAD
=======
            className="bg-[#E5F7CB] hover:bg-[#3A5A40] text-[#3A5A40] hover:text-white font-bold transition-colors"
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
=======
            className="bg-[#E5F7CB] hover:bg-[#3A5A40] text-[#3A5A40] hover:text-white font-bold transition-colors"
>>>>>>> parent of d5e3233 (Revamp auction cards UI and modal tweaks)
        >
            View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

export const AuctionCard = React.memo(AuctionCardInner);