"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  addToWatchlist,
  removeFromWatchlist,
  listAuctionsWatchlist,
} from "@/services/buyer/auctionService";
import { toast  } from "sonner";
import { getAuthClaims } from "@/lib/auth";

interface WatchlistButtonProps {
  auctionId: string;
  userId?: string;
  className?: string;
  onWatchlistChange?: (isInWatchlist: boolean) => void;
}

export function WatchlistButton({
  auctionId,
  userId,
  className = "",
  onWatchlistChange,
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const UserId = getAuthClaims()?.id;

  useEffect(() => {
    if (!UserId) return;

    listAuctionsWatchlist(UserId)
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
  }, [auctionId, UserId]);

  const handleClick = async () => {
    if (!UserId || isLoading || isInWatchlist === null) return;

    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(UserId, auctionId);
        setIsInWatchlist(false);
        onWatchlistChange?.(false);
        toast("Removed from Watchlist!", { position: "top-right" });
      } else {
        await addToWatchlist(UserId, auctionId);
        setIsInWatchlist(true);
        onWatchlistChange?.(true);
        toast("Added to Watchlist!", { position: "top-right" });
      }
    } catch (err) {
      console.error("Watchlist operation failed:", err);
      toast(isInWatchlist ? "Failed to remove from watchlist." : "Failed to add to watchlist.", { position: "top-right" });
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
      style={{ transition: "background 0.2s", fontSize: "0.7rem" }}
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
