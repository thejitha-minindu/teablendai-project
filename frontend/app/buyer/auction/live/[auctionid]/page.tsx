"use client";

import { AuctionDetailLayout } from "@/components/features/buyer/liveauction/AuctionDetailLayout";
import { AuctionTimer } from "@/components/features/buyer/liveauction/AuctionTimer";
import { WinnerModal } from "@/components/features/buyer/liveauction/WinnerModal";
import { getAuction } from "@/services/buyer/auctionService";
import { createBid, listBidsByAuction } from "@/services/buyer/bidService";
import type { AuctionData } from "@/types/buyer/auction.types";
import type { Bid } from "@/types/buyer/bid.types";
import { useAuctionBidsSocket } from "@/hooks/live-auction-socket";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuthClaims } from "@/lib/auth";
import { toast  } from "sonner";

export default function BuyerAuctionLivePage() {
  const params = useParams<{ auctionid: string }>();
  const router = useRouter();
  const auctionId = params?.auctionid ?? "";
  const [userId, setUserId] = useState<string | null>(null);

  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [imageFailed, setImageFailed] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winner, setWinner] = useState<{ winnerId: string | null; winnerName?: string; finalPrice: number } | null>(null);

  const { connected, events } = useAuctionBidsSocket(auctionId);

  useEffect(() => {
    const claims = getAuthClaims();
    setUserId(claims?.id ?? null);
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [auction?.image_url]);

  useEffect(() => {
    if (!auctionId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const auctionData = await getAuction(auctionId);

        const status = String(auctionData?.status || "").trim().toLowerCase();
        if (status === "history") {
          router.replace("/buyer/auctions");
          return;
        }
        if (status !== "live") {
          router.replace(`/buyer/auction/${auctionId}`);
          return;
        }

        setAuction(auctionData);
        const bidData = await listBidsByAuction(auctionId);
        setBids(bidData || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load auction");
        toast.error("Failed to load auction", { position: "top-right" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auctionId, router]);

  useEffect(() => {
    console.log("WebSocket connected:", connected);
    console.log("All events received:", events);
    
    if (!events.length) {
      console.log("No events in the array");
      return;
    }

    // Handle BID_CREATED events
    const createdEvents = events.filter((event) => event.event_type === "BID_CREATED");
    console.log("BID_CREATED events:", createdEvents);
    
    if (createdEvents.length) {
      setBids((previous) => {
        const map = new Map(previous.map((bid) => [bid.bid_id, bid]));

        createdEvents.forEach((event) => {
          const isMyBid = event.data.buyer_id === userId;

          map.set(event.data.bid_id, {
            bid_id: event.data.bid_id,
            auction_id: event.data.auction_id,
            bid_amount: event.data.bid_amount,
            bid_time: new Date(event.data.bid_time),
            buyer_id: event.data.buyer_id,
            buyer_name: event.data.buyer_name,
          });

          toast.success(
            isMyBid ? "Your bid placed!" : "New bid!",
            {
              description: `LKR ${event.data.bid_amount} · ${new Date(event.data.bid_time).toLocaleTimeString()}`,
              position: "top-right",
            }
          );
        });

        return Array.from(map.values()).sort(
          (a, b) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime()
        );
      });
    }

    // Handle AUCTION_WON events (contains winner info)
    const closedEvents = events.filter((event) => {
      const eventType = String(event.event_type);
      return eventType === "AUCTION_WON";
    });
    console.log("AUCTION_WON events:", closedEvents);
    
    if (closedEvents.length) {
      const closedEvent = closedEvents[0];
      console.log("AUCTION_WON received:", closedEvent.data);

      setWinner({
        winnerId: closedEvent.data.winner_id || null,
        winnerName: closedEvent.data.winner_name,
        finalPrice: closedEvent.data.final_price ?? 0,
      });
      setShowWinnerModal(true);

      if (closedEvent.data.winner_id) {
        toast.success("Auction ended! Winner has been determined.", { position: "top-right" });
      } else {
        toast.info("Auction ended - No winner", { position: "top-right" });
      }
    }
  }, [events, userId]);

  const highestBid = useMemo(() => {
    return bids.reduce((current, next) => (next.bid_amount > current ? next.bid_amount : current), auction?.base_price ?? 0);
  }, [bids, auction?.base_price]);

  const myBids = useMemo(
    () => bids.filter((bid) => Boolean(userId) && bid.buyer_id === userId),
    [bids, userId]
  );
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

    if (!userId) {
      setError("Missing authenticated user");
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
        auction_id: auctionId,
        bid_amount: amount,
      });

      setSelectedAmount("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to place bid");
      toast.error("Failed to place bid", { position: "top-right" });
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

  const imageUrl = String(auction.image_url || "").trim();
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <>
      <AuctionDetailLayout
        auction={auction}
        bids={bids}
        highestBid={highestBid}
        myHighestBid={myHighestBid}
        latestBid={latestBid}
        selectedAmount={selectedAmount}
        setSelectedAmount={setSelectedAmount}
        submitting={submitting}
        connected={connected}
        error={error}
        submitBid={submitBid}
        isBidLocked={false}
        statusLabel="Live"
        imageUrl={imageUrl}
        showImage={showImage}
        onImageError={() => setImageFailed(true)}
        startTime={auction.date}
        duration={auction.duration}
        onAuctionEnd={() => {
          toast.info("Auction time has elapsed", { position: "top-right" });
        }}
      />

      {winner && (
        <WinnerModal
          isOpen={showWinnerModal}
          winnerId={winner.winnerId}
          winnerName={winner.winnerName}
          userId={userId}
          finalPrice={winner.finalPrice}
          auctionName={auction.auction_name}
          onClose={() => setShowWinnerModal(false)}
          onViewOrder={() => {
            setShowWinnerModal(false);
            router.push("/buyer/orders");
          }}
          onViewHistory={() => {
            setShowWinnerModal(false);
            router.push("/buyer/history");
          }}
        />
      )}
    </>
  );
}
