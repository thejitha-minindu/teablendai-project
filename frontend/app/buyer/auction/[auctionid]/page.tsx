"use client";

import { AuctionDetailLayout } from "@/components/features/buyer/liveauction/AuctionDetailLayout";
import { getAuction } from "@/services/buyer/auctionService";
import { createBid, listBidsByAuction } from "@/services/buyer/bidService";
import type { AuctionData } from "@/types/buyer/auction.types";
import type { Bid } from "@/types/buyer/bid.types";
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

  const highestBid = 0;

  const myBids = 0;

  const myHighestBid = 0;

  const latestBid = bids[0];

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
      highestBid={highestBid}
      myHighestBid={myHighestBid}
      latestBid={latestBid}
      connected={false}
      error={error}
      isBidLocked={isBidLocked}
      statusLabel="Scheduled"
      imageUrl={imageUrl}
      showImage={showImage}
      onImageError={() => setImageFailed(true)}
    />
  );
}
