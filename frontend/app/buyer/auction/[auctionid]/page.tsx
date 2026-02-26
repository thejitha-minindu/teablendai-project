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
import { getAuction } from "@/services/buyer/auctionService";
import { createBid, listBidsByAuction } from "@/services/buyer/bidService";
import type { AuctionData } from "@/types/buyer/auction.types";
import type { Bid } from "@/types/buyer/bid.types";
import { useAuctionBidsSocket } from "@/hooks/live-auction-socket";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

export default function BuyerAuctionLivePage() {
  const params = useParams<{ auctionid: string }>();
  const auctionId = params?.auctionid ?? "";
  const userId = "11111111-1111-1111-1111-111111111111";

  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<string>("");

  const { connected, events } = useAuctionBidsSocket(auctionId);

  useEffect(() => {
    if (!auctionId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [auctionData, bidData] = await Promise.all([
          getAuction(auctionId),
          listBidsByAuction(auctionId),
        ]);
        setAuction(auctionData);
        setBids(bidData || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load auction");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auctionId]);

  useEffect(() => {
    if (!events.length) return;

    const createdEvents = events.filter((event) => event.event_type === "BID_CREATED");
    if (!createdEvents.length) return;

    setBids((previous) => {
      const map = new Map(previous.map((bid) => [bid.bid_id, bid]));

      createdEvents.forEach((event) => {
        map.set(event.data.bid_id, {
          bid_id: event.data.bid_id,
          auction_id: event.data.auction_id,
          bid_amount: event.data.bid_amount,
          bid_time: new Date(event.data.bid_time),
          buyer_id: event.data.buyer_id,
        });
      });

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime()
      );
    });
  }, [events]);

  const highestBid = useMemo(() => {
    return bids.reduce((current, next) => (next.bid_amount > current ? next.bid_amount : current), auction?.base_price ?? 0);
  }, [bids, auction?.base_price]);

  const myBids = useMemo(() => bids.filter((bid) => bid.buyer_id === userId), [bids]);
  const myHighestBid = useMemo(
    () => myBids.reduce((current, next) => (next.bid_amount > current ? next.bid_amount : current), 0),
    [myBids]
  );

  const latestBid = bids[0];

  const submitBid = async () => {
    const amount = Number(selectedAmount);

    if (!amount || Number.isNaN(amount)) {
      setError("Please select a bid amount");
      return;
    }

    if (!auctionId) {
      setError("Auction is not ready");
      return;
    }

    if (amount <= highestBid) {
      setError(`Bid must be greater than current highest (${highestBid})`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createBid({
        bid_id: crypto.randomUUID(),
        auction_id: auctionId,
        bid_amount: amount,
        bid_time: new Date(),
        buyer_id: userId,
      });

      setSelectedAmount("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to place bid");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading live auction...</div>;
  }

  if (!auction) {
    return <div className="p-6 text-sm text-red-600">Auction not found.</div>;
  }

  return (
    <div className="h-full">
      <div className="flex flex-col h-full lg:grid lg:grid-cols-3">
        <div className="flex flex-col col-span-2 gap-6">
          <div className="w-full mx-auto rounded-md border bg-white p-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color4)" }}>
              Status: Live
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <p><span className="font-medium">Auction:</span> {auction.auction_name || auction.auction_id}</p>
              <p><span className="font-medium">Estate:</span> {auction.estate_name || "N/A"}</p>
              <p><span className="font-medium">Base Price:</span> {auction.base_price} LKR</p>
              <p><span className="font-medium">Highest Bid:</span> {highestBid} LKR</p>
              <p><span className="font-medium">Total Bids:</span> {bids.length}</p>
              <p><span className="font-medium">My Highest Bid:</span> {myHighestBid || "-"} LKR</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="w-full mx-auto rounded-md border bg-white p-4 text-sm">
              <h3 className="text-base font-semibold" style={{ color: "var(--color4)" }}>
                Lot Details
              </h3>
              <div className="mt-3 space-y-2">
                <p><span className="font-medium">Grade:</span> {auction.grade}</p>
                <p><span className="font-medium">Quantity:</span> {auction.quantity} Kg</p>
                <p><span className="font-medium">Company:</span> {auction.company_name || "N/A"}</p>
                <p><span className="font-medium">Seller:</span> {auction.seller_id || "N/A"}</p>
              </div>
            </div>

            <div className="lg:p-4 space-y-3 flex flex-col items-center justify-center relative z-50">
              <div className="flex flex-col gap-2 w-full">
                <div className="px-3 py-2 border rounded-md bg-white text-sm">
                  Amount:{" "}
                  <span id="selected-amount">
                    {selectedAmount || "Select amount"}
                  </span>
                </div>
                <Button
                  variant={"outline"}
                  className="w-full bg-(--color4) text-white"
                  disabled={submitting || !connected}
                  onClick={submitBid}
                >
                  {submitting ? "Placing Bid..." : "Place Bid"}
                </Button>
              </div>

              <div className="w-full relative">
                <Select
                  value={selectedAmount}
                  onValueChange={setSelectedAmount}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="z-100"
                    sideOffset={4}
                  >
                    <SelectItem value={String(highestBid + 100)}>+100 ({highestBid + 100} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 500)}>+500 ({highestBid + 500} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 1000)}>+1000 ({highestBid + 1000} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 2500)}>+2500 ({highestBid + 2500} LKR)</SelectItem>
                    <SelectItem value={String(highestBid + 5000)}>+5000 ({highestBid + 5000} LKR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="h-full">

          {/* helper UI component */}
          {/* <div className="mb-3 rounded-md border bg-white p-3 text-xs text-gray-700">
            <div className="flex items-center justify-between">
              <span>Live updates</span>
              <span className={connected ? "text-green-600" : "text-red-600"}>
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span>Latest bid</span>
              <span>
                {latestBid ? `${latestBid.bid_amount} LKR` : "No bids yet"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>Events</span>
              <span>{events.length}</span>
            </div>
          </div> */}

          <div className="flex flex-col h-full items-center sm:items-start text-xs lg:mx-10 mt-0 mb-10">
            <ScrollArea className="h-48 md:h-60 lg:h-full sm:w-64 md:w-72 lg:w-90 rounded-md border">
              <div className="p-4">
                <h4 className="mb-4 text-sm leading-none font-medium">Bids</h4>
                <div className="h-px bg-muted my-2" />
                {bids.length > 0 ? (
                  bids.map((bid) => (
                    <div key={bid.bid_id}>
                      <div className="text-sm flex flex-col">
                        <p>Amount: {bid.bid_amount} LKR</p>
                        <p>Buyer: {bid.buyer_id.slice(0, 8)}...</p>
                        <p>
                          Time: {new Date(bid.bid_time).toLocaleDateString()} {new Date(bid.bid_time).toLocaleTimeString()}
                        </p>
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
