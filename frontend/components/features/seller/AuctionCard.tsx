"use client";
import React, { memo } from "react";
import { Clock, Tag, Package, TrendingUp, User, Gavel } from "lucide-react";

interface AuctionCardProps {
  auctionId: string;
  id: string;
  type: "live" | "scheduled" | "history";
  data: {
    grade?: string;
    quantity?: number;
    price?: number;
    date?: string;
    time?: string;
    status?: string;
    countdown?: string | null;
    buyer?: string;
    buyer_name?: string;
    image_url?: string;
    custom_auction_id?: string;
    sellerBrand?: string;
  };
  onViewClick?: (auctionId: string) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  live: {
    bg: "bg-green-50 border border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Live",
  },
  scheduled: {
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Scheduled",
  },
  history: {
    bg: "bg-gray-50 border border-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "Ended",
  },
};

function AuctionCardComponent({ auctionId, id, type, data, onViewClick }: AuctionCardProps) {
  const style = STATUS_STYLES[type] ?? STATUS_STYLES.history;

  const isSold = type === "history" && (data.status?.toLowerCase() === "sold" || !!data.buyer);

  const historyBadgeStyle = isSold
    ? { bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" }
    : { bg: "bg-red-50 border border-red-100", text: "text-red-600", dot: "bg-red-400" };

  const badgeStyle = type === "history" ? historyBadgeStyle : { bg: style.bg, text: style.text, dot: style.dot };

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-0.5 flex flex-col"
      style={{ minHeight: 240 }}
    >
      {/* Image / gradient banner */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#2D4A2B] to-[#3A5A40] flex-shrink-0">
        {data.image_url ? (
          <img
            src={data.image_url}
            alt={`Auction ${data.grade ?? ""}`}
            className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Gavel className="w-14 h-14 text-white" />
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle.bg} ${badgeStyle.text} backdrop-blur-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot} ${type === "live" ? "animate-pulse" : ""}`} />
          {type === "history" ? (isSold ? "Sold" : "Unsold") : style.label}
        </div>

        {/* Countdown badge */}
        {data.countdown && type !== "history" && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-mono font-bold">
            <Clock className="w-3 h-3" />
            {data.countdown}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Grade & custom ID */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
              <Tag className="w-3 h-3" />
              {data.custom_auction_id ? (
                <span className="font-mono">{data.custom_auction_id}</span>
              ) : (
                <span className="truncate max-w-[140px]">{id}</span>
              )}
            </div>
            <p className="text-base font-bold text-[#1A2F1C] leading-tight">
              Grade: <span className="text-[#3A5A40]">{data.grade ?? "—"}</span>
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Package className="w-3.5 h-3.5 text-[#A3B18A]" />
            <span>
              <span className="font-semibold text-gray-800">{data.quantity ?? "—"}</span>{" "}
              <span className="text-xs text-gray-400">kg</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <TrendingUp className="w-3.5 h-3.5 text-[#A3B18A]" />
            <span>
              <span className="font-semibold text-gray-800">{data.price != null ? `${data.price}` : "—"}</span>{" "}
              <span className="text-xs text-gray-400">LKR</span>
            </span>
          </div>
        </div>

        {/* Buyer (history only) */}
        {type === "history" && isSold && (data.buyer_name || data.buyer) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3 h-3 text-[#A3B18A]" />
            <span>Won by <span className="font-semibold text-gray-700">{data.buyer_name ?? data.buyer}</span></span>
          </div>
        )}

        {/* Date/time */}
        {(data.date || data.time) && (
          <p className="text-xs text-gray-400">
            {data.date} {data.time && `at ${data.time}`}
          </p>
        )}

        {/* Spacer + View button */}
        <div className="mt-auto pt-2">
          <button
            onClick={() => onViewClick?.(auctionId)}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-[#F5F7EB] text-[#2D4A2B] hover:bg-[#3A5A40] hover:text-white transition-all duration-200"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export const AuctionCard = memo(AuctionCardComponent);
