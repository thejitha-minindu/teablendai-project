"use client";
import React from "react";
import { useAuctionBidsSocket } from "@/hooks/live-auction-socket";

interface AuctionTimerProps {
  auctionId: string;
  basePrice: number;
}

export function AuctionTimer({ auctionId, basePrice }: AuctionTimerProps) {
  const {
    connected,
    auctionStatus,
    timeLeft,
    highestBid,
    bidCount,
    isExtended,
    winner,
    finalPrice,
  } = useAuctionBidsSocket(auctionId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerBgClass = () => {
    if (auctionStatus === "Won") return "from-green-500 to-green-600";
    if (auctionStatus === "Closed") return "from-blue-500 to-blue-600";
    if (timeLeft <= 10) return "from-yellow-500 to-orange-600";
    return "from-purple-500 to-indigo-600";
  };

  const getStatusBadge = () => {
    if (auctionStatus === "Live") {
      return (
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-red-400/30 border border-red-400/50 text-red-100">
            LIVE
        </span>
      );
    }
    if (auctionStatus === "Won") {
      return (
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-green-400/30 border border-green-400/50 text-green-100">
            WON
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-400/30 border border-blue-400/50 text-blue-100">
            CLOSED
      </span>
    );
  };

  return (
    <div className={`bg-gradient-to-br ${getTimerBgClass()} rounded-lg p-6 text-white shadow-xl transition-all duration-300 min-w-80`}>
      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        {getStatusBadge()}
      </div>

      {/* Main Timer Display */}
      <div className={`flex flex-col items-center gap-3 my-6 ${isExtended && auctionStatus === "Live" ? "animate-pulse" : ""}`}>
        <h2 className="text-5xl font-bold font-mono tracking-wider drop-shadow-lg">
          {formatTime(timeLeft)}
        </h2>

        {/* Extension Animation */}
        {isExtended && auctionStatus === "Live" && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-300/20 border border-yellow-300/50 rounded-full animate-pulse">
            <span className="text-sm font-semibold">Extended +10s</span>
          </div>
        )}

        {/* Final Call Warning */}
        {auctionStatus === "Live" && timeLeft > 0 && timeLeft <= 10 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-400/20 border border-red-400/50 rounded-lg animate-pulse">
            <span className="text-sm font-bold">FINAL MOMENTS!</span>
          </div>
        )}
      </div>

      {/* Bid Information */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="flex flex-col items-center gap-1 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <span className="text-xs font-medium opacity-75 uppercase tracking-wider">Highest Bid</span>
          <span className="text-xl font-bold text-white">
            ${highestBid || basePrice}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <span className="text-xs font-medium opacity-75 uppercase tracking-wider">Total Bids</span>
          <span className="text-xl font-bold text-white">{bidCount}</span>
        </div>
      </div>

      {/* Auction Won Display */}
      {auctionStatus === "Won" && (
        <div className="mt-4 p-4 bg-green-400/20 border-2 border-green-400/50 rounded-lg text-center">
          <h3 className="text-2xl font-bold mb-2">AUCTION WON!</h3>
          <p className="text-sm opacity-90 mb-2">Finalizing order...</p>
          <p className="text-sm">
            Closing in: <strong className="text-lg">{formatTime(timeLeft)}</strong>
          </p>
        </div>
      )}

      {/* Auction Closed Display */}
      {auctionStatus === "Closed" && (
        <div className="mt-4 p-4 bg-blue-400/20 border-2 border-blue-400/50 rounded-lg text-center">
          <h3 className="text-2xl font-bold mb-3">AUCTION CLOSED</h3>
          <p className="text-sm opacity-90 mb-1">Winner: <span className="font-semibold">{winner}</span></p>
          <p className="text-lg font-bold text-yellow-200">
            Final Price: ${finalPrice}
          </p>
        </div>
      )}

      {/* Connection Status */}
      <div className="flex justify-center items-center gap-2 mt-4 pt-3 border-t border-white/20 text-xs opacity-80">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connected ? "bg-green-400 animate-pulse" : "bg-red-400 animate-pulse"
          }`}
        ></span>
        <span>{connected ? "Connected" : "Disconnected"}</span>
      </div>
    </div>
  );
}

