"use client";

import { AuctionDetailLayout } from "@/components/features/buyer/liveauction/AuctionDetailLayout";
import { getAuction } from "@/services/buyer/auctionService";
import { createBid, listBidsByAuction } from "@/services/buyer/bidService";
import type { AuctionData } from "@/types/buyer/auction.types";
import type { Bid } from "@/types/buyer/bid.types";
import { useAuctionBidsSocket } from "@/hooks/live-auction-socket";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuthClaims } from "@/lib/auth";

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
        if (status === "live") {
          router.replace(`/buyer/auction/live/${auctionId}`);
          return;
        }

        setAuction(auctionData);
        const bidData = await listBidsByAuction(auctionId);
        setBids(bidData || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load auction");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auctionId, router]);

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

  const isBidLocked = true;
  const imageUrl = String(auction.image_url || "").trim();
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
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
      isBidLocked={isBidLocked}
      statusLabel="Scheduled"
      imageUrl={imageUrl}
      showImage={showImage}
      onImageError={() => setImageFailed(true)}
    />
  );
}
