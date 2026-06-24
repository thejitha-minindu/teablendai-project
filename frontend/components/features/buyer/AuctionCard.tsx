"use client";
import * as React from "react";
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
import { HistoryCardDialog } from "@/components/features/buyer/HistoryCardDialog";
import { OrderCardDialog } from "@/components/features/buyer/OrderCardDialog";
import { WatchlistButton } from "@/components/features/buyer/WatchlistButton";
import { Package, Flag } from "lucide-react";

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

export function AuctionCard({
  cardType,
  auction,
  onWatchlistChange,
}: AuctionCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const getAuctionTargetPath = React.useCallback(
    (auctionId: string) => {
      const rawStatus = String(auction?.status || "")
        .trim()
        .toLowerCase();
      const isLive = rawStatus === "live";
      return isLive
        ? `/buyer/auction/live/${auctionId}`
        : `/buyer/auction/${auctionId}`;
    },
    [auction?.status],
  );

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
      customAuctionId: auction.custom_auction_id,
      imageUrl: auction.image_url || auction.imageUrl,
      status: auction.status,
      countdown: auction.countdown,
    };
  }, [auction, cardType]);

  const renderFooterButton = () => {
    const auctionId = auction?.auction_id || auction?.id || "";

    switch (cardType) {
      case "history":
        return <HistoryCardDialog auctionId={auctionId} />;
      case "order":
        return (
          <div className="flex gap-3 w-full justify-between">
            <div className="flex-1">
              <OrderCardDialog auctionId={auctionId} />
            </div>
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl py-5 text-sm transition-colors"
              title="Report Seller"
              onClick={(e) => {
                e.stopPropagation();
                const sellerId = auction?.seller_id || auction?.sellerId || "";
                window.location.href = `/buyer/violations?violatorId=${sellerId}&auctionId=${auctionId}`;
              }}
            >
              Report
            </Button>
          </div>
        );
      case "auction":
        return (
          <div className="flex flex-wrap gap-3 justify-between w-full">
            <WatchlistButton
              auctionId={auctionId}
              className="flex-1 min-w-[120px] rounded-xl"
              onWatchlistChange={onWatchlistChange}
            />
            <Button
              className="flex-1 min-w-[120px] bg-[#E5F7CB] hover:bg-[#d4eab6] text-black font-bold rounded-xl py-5 text-sm transition-colors"
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
    <Card
      className="w-full mx-auto h-full hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden border-gray-100 p-0 gap-0 flex flex-col bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-[200px] overflow-hidden bg-gray-50 flex items-center justify-center m-0 shrink-0">
        {safeAuction.imageUrl ? (
          <img src={safeAuction.imageUrl} alt="Tea Lot" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
        ) : (
          <Package className="w-16 h-16 text-gray-300" />
        )}
      </div>

      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4 pb-4 pt-5 px-5 border-b border-gray-100 shrink-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-black text-xl font-bold break-all">
              {safeAuction.title}
            </CardTitle>
            {safeAuction.status?.toLowerCase() === "live" && (
              <Badge variant="destructive" className="animate-pulse flex gap-1 items-center text-white font-bold bg-red-600">
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-black font-medium text-sm">
            {safeAuction.grade} Grade <span className="text-gray-500 font-normal ml-1">(by {safeAuction.company})</span>
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end text-sm text-black shrink-0">
          <p className="font-medium">{displayDate}</p>
          {displayTime !== "-" && <p className="font-medium">{displayTime}</p>}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 pt-4 flex-grow">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-1">
            <span className="text-sm font-medium text-black">
              {(cardType === "history" || cardType === "order") ? "Sold Price" : "Base Price"}:
            </span>
            <span className="text-lg font-bold text-black">
              {(cardType === "history" || cardType === "order") ? safeAuction.soldPrice : safeAuction.basePrice}
            </span>
          </div>

          <p className="flex justify-between text-sm items-center">
            <span className="font-medium text-black">Estate:</span>
            <span className="font-medium text-black break-all text-right max-w-[60%]">{safeAuction.estateName}</span>
          </p>

          <p className="flex justify-between text-sm items-center">
            <span className="font-medium text-black">Quantity:</span>
            <span className="font-medium text-black">{safeAuction.quantity}</span>
          </p>

          {(cardType === "history" || cardType === "order") && (
            <p className="flex justify-between text-sm items-center">
              <span className="font-medium text-black">Winner:</span>
              <span className="font-semibold text-black break-all text-right max-w-[60%]">{safeAuction.winnerName}</span>
            </p>
          )}

          {safeAuction.customAuctionId && (
            <p className="flex justify-between text-sm items-center">
              <span className="font-medium text-black">Ref ID:</span>
              <span className="font-medium text-black break-all text-right max-w-[60%]">{safeAuction.customAuctionId}</span>
            </p>
          )}

          {safeAuction.countdown && (
            <div className={`mt-3 p-3 rounded-lg flex justify-between items-center ${safeAuction.status?.toLowerCase() === 'live' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
              <span className="text-xs font-bold uppercase tracking-wider">
                {safeAuction.status?.toLowerCase() === 'live' ? 'Ending In' : 'Starts In'}
              </span>
              <span className="text-sm font-mono font-bold">
                {safeAuction.countdown}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-center pb-6 pt-2 px-5 shrink-0">
        {renderFooterButton()}
      </CardFooter>
    </Card>
  );
}
