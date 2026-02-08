"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  addToWatchlist,
  removeFromWatchlist,
  listAuctionsWatchlist,
} from "@/services/buyer/auctionService";

interface WatchlistButtonProps {
  auctionId: string;
  userId?: string;
  className?: string;
}

export function WatchlistButton({
  auctionId,
  userId = "11111111-1111-1111-1111-111111111111",
  className = "",
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!auctionId) return;

    listAuctionsWatchlist(userId)
      .then((watchlist) => {
        const found = watchlist.some(
          (auction) => auction.auction_id === auctionId
        );
        setIsInWatchlist(found);
      })
      .catch((err) => {
        console.error("Failed to fetch watchlist:", err);
        setIsInWatchlist(false);
      });
  }, [auctionId, userId]);

  const handleClick = async () => {
    if (isLoading || isInWatchlist === null) return;

    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(userId, auctionId);
        setIsInWatchlist(false);
        alert("Removed from Watchlist!");
      } else {
        await addToWatchlist(userId, auctionId);
        setIsInWatchlist(true);
        alert("Added to Watchlist!");
      }
    } catch (err) {
      console.error("Watchlist operation failed:", err);
      alert(isInWatchlist ? "Failed to remove from watchlist." : "Failed to add to watchlist.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = useMemo(() => {
    if (isInWatchlist === null) return "Loading...";
    if (isLoading) return isInWatchlist ? "Removing..." : "Adding...";
    return isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist";
  }, [isInWatchlist, isLoading]);

  return (
    <Button
      variant="outline"
      style={{ transition: "background 0.2s" }}
      className={`hover:text-white hover:cursor-pointer ${className}`}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "var(--color3)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
      onClick={handleClick}
      disabled={isLoading || isInWatchlist === null}
    >
      {buttonText}
    </Button>
  );
}
