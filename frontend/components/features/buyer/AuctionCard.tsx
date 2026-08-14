"use client";
import React, { memo } from "react";
import { useRouter } from "next/navigation";
import { Tag, Package, TrendingUp, User, Building2, Gavel } from "lucide-react";
import { WatchlistButton } from "@/components/features/buyer/WatchlistButton";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuctionItem {
  id?: string;
  auction_id?: string;
  auction_name?: string;
  company_name?: string;
  estate_name?: string;
  seller_brand?: string;
  grade?: string;
  quantity?: number;
  base_price?: number;
  sold_price?: number;
  date?: string | Date;
  status?: string;
  buyer?: string;
  buyer_name?: string;
  image_url?: string;
  custom_auction_id?: string;
}

interface BuyerAuctionCardProps {
  cardType: "auction" | "history";
  auction: AuctionItem;
  onWatchlistChange?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return String(date);
  }
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-[#A3B18A] flex-shrink-0" />
      <span className="text-xs text-gray-500">{label}:</span>
      <span className="text-xs font-semibold text-gray-800 truncate">{value ?? "—"}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
function BuyerAuctionCardComponent({ cardType, auction, onWatchlistChange }: BuyerAuctionCardProps) {
  const router = useRouter();
  const auctionId = auction.auction_id ?? auction.id ?? "";
  const isLive = String(auction.status ?? "").toLowerCase() === "live";
  const isSold = cardType === "history" && (!!auction.buyer || !!auction.buyer_name || !!auction.sold_price);

  const handleCardClick = () => {
    if (cardType !== "auction" || !auctionId) return;
    const path = isLive ? `/buyer/auction/live/${auctionId}` : `/buyer/auction/${auctionId}`;
    router.push(path);
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 ${cardType === "auction" ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={cardType === "auction" ? handleCardClick : undefined}
    >
      {/* Image / banner */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#3A5A40] to-[#1A2F1C] flex-shrink-0">
        {auction.image_url ? (
          <img
            src={auction.image_url}
            alt={auction.auction_name ?? "Auction"}
            className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Gavel className="w-14 h-14 text-white" />
          </div>
        )}

        {/* Status badge */}
        {cardType === "auction" && auction.status && (
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${isLive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
            {isLive ? "Live" : "Scheduled"}
          </div>
        )}

        {/* History sold/unsold badge */}
        {cardType === "history" && (
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${isSold ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSold ? "bg-emerald-500" : "bg-red-400"}`} />
            {isSold ? "Won" : "No Win"}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <div>
          <p className="text-base font-bold text-[#1A2F1C] leading-tight truncate">
            {auction.auction_name ?? `Grade ${auction.grade ?? "—"}`}
          </p>
          {(auction.company_name || auction.estate_name || auction.seller_brand) && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400 truncate">
                {auction.estate_name ?? auction.company_name ?? auction.seller_brand}
              </p>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="flex flex-col gap-1.5">
          <InfoRow icon={Tag} label="Grade" value={auction.grade} />
          <InfoRow icon={Package} label="Qty" value={auction.quantity != null ? `${auction.quantity} kg` : null} />
          {cardType === "auction" && (
            <InfoRow icon={TrendingUp} label="Base" value={auction.base_price != null ? `${auction.base_price} LKR` : null} />
          )}
          {cardType === "history" && isSold && (
            <InfoRow icon={TrendingUp} label="Sold" value={auction.sold_price != null ? `${auction.sold_price} LKR` : null} />
          )}
          {cardType === "history" && isSold && (auction.buyer_name ?? auction.buyer) && (
            <InfoRow icon={User} label="Winner" value={auction.buyer_name ?? auction.buyer} />
          )}
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400">{formatDate(auction.date)}</p>

        {/* Watchlist button (auction type on dashboard) */}
        {cardType === "auction" && auctionId && (
          <div
            className="mt-auto"
            onClick={(e) => e.stopPropagation()} // prevent card click navigation
          >
            <WatchlistButton
              auctionId={auctionId}
              className="w-full text-xs py-1.5"
              onWatchlistChange={() => onWatchlistChange?.()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const AuctionCard = memo(BuyerAuctionCardComponent);
