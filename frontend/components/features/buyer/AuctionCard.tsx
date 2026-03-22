"use client";
import * as React from "react";
import "@/app/globals.css";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryCardDialog } from "@/components/features/buyer/HistoryCardDialog";
import { OrderCardDialog } from "@/components/features/buyer/OrderCardDialog";
import { WatchlistButton } from "@/components/features/buyer/WatchlistButton";

export type CardType = "order" | "history" | "auction";

// Accepts both legacy and backend auction objects
export interface AuctionDetails {
  [key: string]: any;
}

export interface AuctionCardProps {
  cardType: CardType;
  auction?: AuctionDetails;
  onWatchlistChange?: (isInWatchlist: boolean) => void;
}

const getDefaultAuction = (cardType: CardType): AuctionDetails => ({
  title: cardType === "auction" ? "Live Auction" : "Auction",
  company: "Not specified",
  date: new Date().toISOString().split("T")[0],
  estateName: "Not specified",
  quantity: "0 kg",
  grade: "N/A",
  basePrice: "$0",
  ...(cardType === "auction" && { time: "TBD" }),
});

export function AuctionCard({ cardType, auction, onWatchlistChange }: AuctionCardProps) {
  const getAuctionTargetPath = React.useCallback((auctionId: string) => {
    const rawStatus = String(auction?.status || "").trim().toLowerCase();
    const isLive = rawStatus === "live";
    return isLive
      ? `/buyer/auction/live/${auctionId}`
      : `/buyer/auction/${auctionId}`;
  }, [auction?.status]);

  const safeAuction = React.useMemo(() => {
    if (!auction) return getDefaultAuction(cardType);

    // Extract raw values from auction object with multiple fallbacks
    const rawTitle = auction.auction_name || auction.title || "Auction";
    const rawCompany = auction.company_name || auction.company || "-";
    const rawDate = auction.date;
    const rawEstateName = auction.estate_name || auction.estateName || "-";
    const rawQuantity = auction.quantity;
    const rawGrade = auction.grade || "-";
    const rawBasePrice = auction.base_price || auction.basePrice;
    const rawSoldPrice = auction.sold_price || auction.soldPrice;
    const rawWinner = auction.buyer || auction.winner;
    const rawWinnerName = auction.buyer_name || "-";
    const rawTime = auction.time;

    return {
      title: rawTitle,
      company: rawCompany,
      date: rawDate
        ? new Date(rawDate).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "-",
      estateName: rawEstateName,
      quantity:
        rawQuantity !== undefined && rawQuantity !== null
          ? `${rawQuantity} kg`
          : "-",
      grade: rawGrade,
      basePrice: rawBasePrice ? `${rawBasePrice} LKR` : "-",
      soldPrice: rawSoldPrice ? `${rawSoldPrice} LKR` : undefined,
      winner: rawWinner,
      winnerName: rawWinnerName,
      time: rawTime,
    };
  }, [auction, cardType]);

  const renderAuctionDetails = () => (
    <div className="flex flex-col gap-2">
      <h2 className="text-m font-semibold mb-2">{safeAuction.estateName}</h2>
      <p className="mb-1 text-sm">
        <span className="font-medium">Quantity:</span> {safeAuction.quantity}
      </p>
      <p className="mb-1 text-sm">
        <span className="font-medium">Grade:</span> {safeAuction.grade}
      </p>
      {(cardType === "history" || cardType === "order") && (
        <p className="mb-1 text-sm">
          <span className="font-medium">Sold Price:</span>{" "}
          {safeAuction.soldPrice}
        </p>
      )}
      {cardType === "auction" && (
        <p className="mb-1 text-sm">
          <span className="font-medium">Base Price:</span>{" "}
          {safeAuction.basePrice}
        </p>
      )}
      {cardType === "history" && (
        <p className="mb-1 text-sm">
          <span className="font-medium">Winner:</span> {safeAuction.winnerName}
        </p>
      )}
    </div>
  );

  const renderFooterButton = () => {
    const auctionId = auction?.auction_id || auction?.id || "";

    switch (cardType) {
      case "history":
        return <HistoryCardDialog auctionId={auctionId} />;
      case "order":
        return <OrderCardDialog auctionId={auctionId} />;
      case "auction":
        return (
          <div className="flex flex-wrap gap-4 justify-between w-full">
            <WatchlistButton
              auctionId={auctionId}
              className="flex-1 min-w-[120px]"
              onWatchlistChange={onWatchlistChange}
            />
            <Button
              variant="outline"
              style={{ transition: "background 0.2s" }}
              className="hover:text-white hover:cursor-pointer flex-1 min-w-[120px]"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--color3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "")
              }
              onClick={() => {
                if (!auctionId) return;
                window.location.href = getAuctionTargetPath(auctionId);
              }}
            >
              Place Bid
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  // Parse date and time for display
  let displayDate = "-";
  let displayTime = "-";
  if (auction?.date) {
    const d = new Date(auction.date);
    displayDate = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    displayTime = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4">
        <div className="flex flex-col">
          <CardTitle style={{ color: "var(--color4)", fontWeight: "bold" }}>
            {safeAuction.title}
          </CardTitle>
          <CardDescription style={{ color: "var(--color3)" }}>
            (by {safeAuction.company})
          </CardDescription>
        </div>
        <div className="flex flex-row items-start sm:items-end text-sm text-muted-foreground">
          <div className="flex flex-col items-end">
            <p>{displayDate}</p>
            <p>{displayTime}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto gap-5">
            {renderAuctionDetails()}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {renderFooterButton()}
      </CardFooter>
    </Card>
  );
}