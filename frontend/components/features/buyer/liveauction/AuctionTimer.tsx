"use client";

import { useEffect, useState } from "react";

interface AuctionTimerProps {
  startTime: Date | string;
  duration: number; // stored in minutes
  onAuctionEnd?: () => void;
}

export function AuctionTimer({ startTime, duration, onAuctionEnd }: AuctionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isEnded, setIsEnded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Convert startTime to timestamp
    let startTimeMs: number;
    
    if (typeof startTime === "string") {
      // Parse ISO string and ensure it's treated as UTC
      let isoString = startTime.trim();
      // If no Z suffix and no timezone info, assume UTC
      if (!isoString.endsWith("Z") && !isoString.includes("+") && !isoString.includes("-")) {
        isoString = isoString + "Z";
      }
      startTimeMs = new Date(isoString).getTime();
    } else {
      startTimeMs = startTime.getTime();
    }

    const endTimeMs = startTimeMs + duration * 60 * 1000;

    console.log("AuctionTimer Debug:", {
      startTime,
      startTimeMs: new Date(startTimeMs).toISOString(),
      duration,
      endTimeMs: new Date(endTimeMs).toISOString(),
      now: new Date().toISOString(),
      secondsUntilEnd: Math.floor((endTimeMs - Date.now()) / 1000),
    });

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTimeMs - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0 && !isEnded) {
        console.log("Auction timer ended");
        setIsEnded(true);
        onAuctionEnd?.();
      }
    };

    updateTimer(); // Initial call to set correct time immediately
    setHasInitialized(true);
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration, isEnded, onAuctionEnd]);

  // Format time as HH:MM:SS
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const formatTime = (num: number) => String(num).padStart(2, "0");

  // Color based on time remaining
  let bgColor = "bg-green-100";
  let textColor = "text-green-700";

  if (timeRemaining < 60) {
    bgColor = "bg-red-100";
    textColor = "text-red-700";
  } else if (timeRemaining < 300) {
    bgColor = "bg-yellow-100";
    textColor = "text-yellow-700";
  }

  // Show loading state while initializing
  if (!hasInitialized) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Remaining</p>
        <div className="mt-2 text-4xl font-bold font-mono text-gray-500">--:--:--</div>
        <p className="mt-2 text-sm text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg ${bgColor} p-4 text-center`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time Remaining</p>
      <div className={`mt-2 text-4xl font-bold font-mono ${textColor}`}>
        {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {isEnded ? "Auction Ended" : "Countdown in Progress"}
      </p>
    </div>
  );
}
