"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AuctionTimer } from "@/components/features/buyer/liveauction/AuctionTimer";
import type { AuctionData } from "@/types/buyer/auction.types";
import type { Bid } from "@/types/buyer/bid.types";

type AuctionDetailLayoutProps = {
  auction: AuctionData;
  bids?: Bid[] | undefined;
  highestBid: number;
  myHighestBid: number;
  latestBid?: Bid;
  selectedAmount?: string;
  setSelectedAmount?: (value: string) => void;
  submitting?: boolean;
  connected: boolean;
  error: string | null;
  submitBid?: () => Promise<void>;
  isBidLocked: boolean;
  statusLabel: "Live" | "Scheduled";
  imageUrl: string;
  showImage: boolean;
  onImageError: () => void;
  startTime?: Date | string;
  duration?: number;
  onAuctionEnd?: () => void;
};

export function AuctionDetailLayout({
  auction,
  bids,
  highestBid,
  myHighestBid,
  latestBid,
  selectedAmount,
  setSelectedAmount,
  submitting,
  connected,
  error,
  submitBid,
  isBidLocked,
  statusLabel,
  imageUrl,
  showImage,
  onImageError,
  startTime,
  duration,
  onAuctionEnd,
}: AuctionDetailLayoutProps) {
  const statusClassName =
    statusLabel === "Live"
      ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
      : "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";

  return (
    <div className="px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Auction Overview</p>
              <h2 className="text-xl font-semibold" style={{ color: "var(--color4)" }}>
                {auction.auction_name || auction.auction_id}
              </h2>
            </div>
            <span className={statusClassName}>Status: {statusLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div><p className="text-muted-foreground">Estate</p><p className="font-medium">{auction.estate_name || "N/A"}</p></div>
            <div><p className="text-muted-foreground">Base Price</p><p className="font-medium">{auction.base_price} LKR</p></div>
            <div><p className="text-muted-foreground">Highest Bid</p><p className="font-medium">{highestBid} LKR</p></div>
            <div><p className="text-muted-foreground">Total Bids</p><p className="font-medium">{bids?.length || 0}</p></div>
            <div><p className="text-muted-foreground">My Highest</p><p className="font-medium">{myHighestBid || "-"} LKR</p></div>
            <div><p className="text-muted-foreground">Latest Bid</p><p className="font-medium">{latestBid ? `${latestBid.bid_amount} LKR` : "N/A"}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-5 shadow-sm h-full flex flex-col">
              <h3 className="text-base font-semibold" style={{ color: "var(--color4)" }}>Lot Details</h3>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-medium">Grade:</span> {auction.grade}</p>
                <p><span className="font-medium">Quantity:</span> {auction.quantity} Kg</p>
                <p><span className="font-medium">Company:</span> {auction.company_name || "N/A"}</p>
                <p><span className="font-medium">Seller:</span> {auction.seller_brand || "N/A"}</p>
                <div className="mt-3 pt-3 border-t">
                  <p><span className="font-medium">Start Time:</span> {new Date(auction.date).toLocaleString()}</p>
                  <p><span className="font-medium">Duration:</span> {Math.floor(auction.duration / 60)} minutes ({auction.duration} sec)</p>
                </div>
              </div>
              <div className="mt-4 flex-1 min-h-0 p-2">
                <div className="h-full min-h-40 overflow-hidden rounded-md border bg-muted/30">
                  {showImage ? (
                    <img
                      src={imageUrl}
                      alt={auction.auction_name || "Auction image"}
                      className="h-full w-full object-cover"
                      onError={onImageError}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-white text-xs font-medium text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-5 ${isBidLocked ? "rounded-xl border bg-white shadow-sm opacity-60" : ""}`}>
              <h3 className="text-base font-semibold" style={{ color: "var(--color4)" }}>Place Your Bid</h3>
              <div className="mt-4 space-y-3">
                <Select value={selectedAmount} onValueChange={setSelectedAmount} disabled={isBidLocked}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isBidLocked ? "Bidding available when auction goes live" : "Select amount"} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value={String(highestBid + 100)}>+100 ({highestBid + 100} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 500)}>+500 ({highestBid + 500} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 1000)}>+1000 ({highestBid + 1000} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 2500)}>+2500 ({highestBid + 2500} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 5000)}>+5000 ({highestBid + 5000} LKR)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  className={isBidLocked ? "w-full" : "w-full text-white"}
                  style={isBidLocked ? undefined : { backgroundColor: "var(--color4)" }}
                  variant={isBidLocked ? "outline" : "default"}
                  disabled={isBidLocked || submitting || !connected}
                  onClick={submitBid}
                >
                  {isBidLocked ? "Locked Until Live" : submitting ? "Placing Bid..." : "Place Bid"}
                </Button>

                {!connected && !isBidLocked && (
                  <p className="text-xs text-amber-700">Live connection unavailable. Reconnect to place bids.</p>
                )}

                {isBidLocked && (
                  <p className="text-xs text-muted-foreground">
                    Scheduled auctions cannot be bid on yet. Bidding controls unlock automatically when status becomes live.
                  </p>
                )}

                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}
              </div>
              {startTime && duration && (
                <div className="m-4 mt-20">
                  <AuctionTimer
                    startTime={startTime}
                    duration={duration}
                    onAuctionEnd={onAuctionEnd}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h4 className="text-sm font-semibold">Bids</h4>
            </div>
            <ScrollArea className="h-105">
              <div className="p-4">
                {bids && bids.length > 0 ? (
                  bids.map((bid) => (
                    <div key={bid.bid_id}>
                      <div className="text-sm">
                        <p>Amount: {bid.bid_amount} LKR</p>
                        <p>Buyer: {bid.buyer_name || "Unknown"}</p>
                        <p>Time: {new Date(bid.bid_time).toLocaleDateString()} {new Date(bid.bid_time).toLocaleTimeString()}</p>
                      </div>
                      <Separator className="my-3" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No bids found</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
