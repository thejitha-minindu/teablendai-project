"use client";

import React from "react";
import { useAuctionBidsSocket } from "@/hooks/live-auction-socket";
import "./auction-timer.css";

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

  const getTimerClass = () => {
    if (auctionStatus === "Won") return "timer-won";
    if (auctionStatus === "Closed") return "timer-closed";
    if (timeLeft <= 10) return "timer-urgent";
    return "timer-live";
  };

  return (
    <div className={`auction-timer-container ${getTimerClass()}`}>
      {/* Status Badge */}
      <div className="timer-status">
        {auctionStatus === "Live" && (
          <span className="badge badge-live">🔴 LIVE</span>
        )}
        {auctionStatus === "Won" && (
          <span className="badge badge-won">🏆 WON</span>
        )}
        {auctionStatus === "Closed" && (
          <span className="badge badge-closed">✅ CLOSED</span>
        )}
      </div>

      {/* Main Timer Display */}
      <div className={`timer-display ${isExtended ? "extended-pulse" : ""}`}>
        <h2 className="timer-value">{formatTime(timeLeft)}</h2>

        {/* Extension Animation */}
        {isExtended && auctionStatus === "Live" && (
          <div className="extension-badge">
            <span className="pulse-icon">⏱️</span>
            <span>Extended +10s</span>
          </div>
        )}

        {/* Final Call Warning */}
        {auctionStatus === "Live" && timeLeft > 0 && timeLeft <= 10 && (
          <div className="warning-text">
            <span>⚠️ FINAL MOMENTS!</span>
          </div>
        )}
      </div>

      {/* Bid Information */}
      <div className="bid-info">
        <div className="bid-stat">
          <span className="stat-label">Highest Bid:</span>
          <span className="stat-value">${highestBid || basePrice}</span>
        </div>
        <div className="bid-stat">
          <span className="stat-label">Total Bids:</span>
          <span className="stat-value">{bidCount}</span>
        </div>
      </div>

      {/* Auction Won Display */}
      {auctionStatus === "Won" && (
        <div className="won-container">
          <div className="won-info">
            <h3>🏆 AUCTION WON!</h3>
            <p>Finalizing order...</p>
            <p className="grace-text">
              Closing in: <strong>{formatTime(timeLeft)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Auction Closed Display */}
      {auctionStatus === "Closed" && (
        <div className="closed-container">
          <div className="closed-info">
            <h3>✅ AUCTION CLOSED</h3>
            <p className="winner-text">Winner: {winner}</p>
            <p className="final-price">Final Price: ${finalPrice}</p>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className={`connection-indicator ${connected ? "connected" : "disconnected"}`}>
        <span className={`dot ${connected ? "dot-green" : "dot-red"}`}></span>
        <span>{connected ? "Connected" : "Disconnected"}</span>
      </div>
    </div>
  );
}
