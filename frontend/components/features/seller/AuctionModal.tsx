"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Clock, Package, TrendingUp, Tag, User, Gavel, CalendarClock, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { parseBackendDateTime, durationToMinutes, formatDurationFromMinutes } from "@/utils/dateFormatter";

// ─── Shared overlay wrapper ───────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

// ─── Shared modal shell ───────────────────────────────────────────────────────
function ModalShell({ title, subtitle, children, onClose, accentColor = "#3A5A40" }: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  accentColor?: string;
}) {
  return (
    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
      {/* Header */}
      <div
        className="relative flex items-start justify-between px-6 pt-6 pb-4 rounded-t-3xl"
        style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #1A2F1C 100%)` }}
      >
        <div>
          <h2 className="text-xl font-extrabold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-white/70 text-sm mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-4 mt-0.5 text-white/60 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}

// ─── Info row helper ──────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-[#F5F7EB] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#3A5A40]" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ type }: { type: "live" | "scheduled" | "history" | "sold" | "unsold" }) {
  const map: Record<string, { bg: string; text: string; dot: string; label: string; pulse?: boolean }> = {
    live: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", label: "Live Now", pulse: true },
    scheduled: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Scheduled" },
    history: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "Ended" },
    sold: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Sold" },
    unsold: { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-400", label: "Unsold" },
  };
  const s = map[type] ?? map.history;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}

// ─── LiveAuctionModal ─────────────────────────────────────────────────────────
interface LiveAuctionModalProps {
  auctionId: string;
  onClose: () => void;
}

export function LiveAuctionModal({ auctionId, onClose }: LiveAuctionModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/auctions/${auctionId}`)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError("Failed to load auction details."); setLoading(false); });
  }, [auctionId]);

  // Live countdown timer
  useEffect(() => {
    if (!data) return;
    const tick = () => {
      const startDate = parseBackendDateTime(data.start_time);
      if (!startDate) { setCountdown("—"); return; }
      const durationMinutes = durationToMinutes(data.duration);
      const endTime = startDate.getTime() + durationMinutes * 60 * 1000;
      const diff = endTime - Date.now();
      if (diff <= 0) { setCountdown("Closing..."); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  return (
    <ModalOverlay onClose={onClose}>
      <ModalShell
        title="Live Auction Details"
        subtitle={data?.custom_auction_id ? `Ref: ${data.custom_auction_id}` : undefined}
        onClose={onClose}
        accentColor="#16a34a"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-[#3A5A40] border-t-transparent rounded-full mr-3" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-500 bg-red-50 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        ) : data ? (
          <>
            <div className="flex items-center justify-between">
              <StatusBadge type="live" />
              {countdown && (
                <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4" />
                  {countdown}
                </div>
              )}
            </div>

            {data.image_url && (
              <img
                src={data.image_url}
                alt="Auction"
                className="w-full h-40 object-cover rounded-2xl"
              />
            )}

            <div className="bg-gray-50 rounded-2xl px-4 py-2">
              <InfoRow icon={Tag} label="Grade" value={data.grade} />
              <InfoRow icon={Package} label="Quantity" value={data.quantity != null ? `${data.quantity} kg` : null} />
              <InfoRow icon={TrendingUp} label="Base Price" value={data.base_price != null ? `${data.base_price} LKR` : null} />
              <InfoRow icon={TrendingUp} label="Highest Bid" value={data.highest_bid != null ? `${data.highest_bid} LKR` : "No bids yet"} />
              <InfoRow icon={Clock} label="Duration" value={formatDurationFromMinutes(data.duration)} />
              {(data.buyer_name || data.buyer) && (
                <InfoRow icon={User} label="Current Leader" value={data.buyer_name ?? data.buyer} />
              )}
            </div>
          </>
        ) : null}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-[#F5F7EB] text-[#2D4A2B] hover:bg-[#3A5A40] hover:text-white transition-all duration-200 mt-2"
        >
          Close
        </button>
      </ModalShell>
    </ModalOverlay>
  );
}

// ─── ScheduledAuctionModal ────────────────────────────────────────────────────
interface ScheduledAuctionModalProps {
  auctionId: string;
  onClose: () => void;
}

export function ScheduledAuctionModal({ auctionId, onClose }: ScheduledAuctionModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(`/auctions/${auctionId}`)
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError("Failed to load auction details."); setLoading(false); });
  }, [auctionId]);

  // Countdown until start
  useEffect(() => {
    if (!data) return;
    const tick = () => {
      const startDate = parseBackendDateTime(data.start_time);
      if (!startDate) { setCountdown("—"); return; }
      const diff = startDate.getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting..."); return; }
      const days = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(days > 0 ? `${days}d ${h}h ${m}m` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Are you sure you want to cancel this auction?")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/auctions/${auctionId}`);
      setDeleted(true);
      setTimeout(onClose, 1200);
    } catch {
      alert("Failed to cancel the auction. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [auctionId, onClose]);

  const startDateFormatted = data ? (() => {
    const d = parseBackendDateTime(data.start_time);
    if (!d) return null;
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  })() : null;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalShell
        title="Scheduled Auction"
        subtitle={data?.custom_auction_id ? `Ref: ${data.custom_auction_id}` : undefined}
        onClose={onClose}
        accentColor="#d97706"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mr-3" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-500 bg-red-50 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        ) : deleted ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-emerald-600">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Gavel className="w-6 h-6" />
            </div>
            <p className="font-semibold">Auction cancelled successfully.</p>
          </div>
        ) : data ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <StatusBadge type="scheduled" />
              {countdown && (
                <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4" />
                  {countdown}
                </div>
              )}
            </div>

            {data.image_url && (
              <img
                src={data.image_url}
                alt="Auction"
                className="w-full h-40 object-cover rounded-2xl"
              />
            )}

            <div className="bg-gray-50 rounded-2xl px-4 py-2">
              <InfoRow icon={Tag} label="Grade" value={data.grade} />
              <InfoRow icon={Package} label="Quantity" value={data.quantity != null ? `${data.quantity} kg` : null} />
              <InfoRow icon={TrendingUp} label="Base Price" value={data.base_price != null ? `${data.base_price} LKR` : null} />
              <InfoRow icon={CalendarClock} label="Starts At" value={startDateFormatted} />
              <InfoRow icon={Clock} label="Duration" value={formatDurationFromMinutes(data.duration)} />
              {data.description && <InfoRow icon={Tag} label="Description" value={data.description} />}
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Cancelling..." : "Cancel Auction"}
            </button>
          </>
        ) : null}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-[#F5F7EB] text-[#2D4A2B] hover:bg-[#3A5A40] hover:text-white transition-all duration-200"
        >
          Close
        </button>
      </ModalShell>
    </ModalOverlay>
  );
}

// ─── HistoryAuctionModal ──────────────────────────────────────────────────────
interface HistoryAuctionModalProps {
  auctionId: string;
  data: {
    grade?: string;
    quantity?: number;
    price?: number;
    date?: string;
    time?: string;
    status?: string;
    buyer?: string;
    buyer_name?: string;
    image_url?: string;
    custom_auction_id?: string;
  };
  onClose: () => void;
}

export function HistoryAuctionModal({ auctionId, data, onClose }: HistoryAuctionModalProps) {
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(`/auctions/${auctionId}`)
      .then((res) => { setDetail(res.data); })
      .catch(() => { /* use passed data as fallback */ })
      .finally(() => setLoading(false));
  }, [auctionId]);

  const isSold = data.status?.toLowerCase() === "sold" || !!data.buyer;
  const d = detail ?? data;
  const soldPrice = d.sold_price ?? d.highest_bid ?? d.price;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalShell
        title="Auction Record"
        subtitle={data.custom_auction_id ? `Ref: ${data.custom_auction_id}` : `Auction ID: ${auctionId.slice(0, 8)}…`}
        onClose={onClose}
        accentColor="#4B5563"
      >
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <div className="animate-spin w-7 h-7 border-2 border-gray-400 border-t-transparent rounded-full mr-3" />
            Loading...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge type={isSold ? "sold" : "unsold"} />
              {data.date && (
                <span className="text-xs text-gray-400">{data.date} {data.time ? `at ${data.time}` : ""}</span>
              )}
            </div>

            {(d.image_url ?? data.image_url) && (
              <img
                src={d.image_url ?? data.image_url}
                alt="Auction"
                className="w-full h-40 object-cover rounded-2xl"
              />
            )}

            <div className="bg-gray-50 rounded-2xl px-4 py-2">
              <InfoRow icon={Tag} label="Grade" value={d.grade ?? data.grade} />
              <InfoRow icon={Package} label="Quantity" value={(d.quantity ?? data.quantity) != null ? `${d.quantity ?? data.quantity} kg` : null} />
              <InfoRow icon={TrendingUp} label="Base Price" value={d.base_price != null ? `${d.base_price} LKR` : null} />
              {isSold && (
                <InfoRow icon={TrendingUp} label="Sold Price" value={soldPrice != null ? `${soldPrice} LKR` : null} />
              )}
              {isSold && (d.buyer_name ?? d.buyer ?? data.buyer_name ?? data.buyer) && (
                <InfoRow icon={User} label="Winner" value={d.buyer_name ?? d.buyer ?? data.buyer_name ?? data.buyer} />
              )}
              {!isSold && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-sm text-gray-500">No bids were placed on this auction.</p>
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-[#F5F7EB] text-[#2D4A2B] hover:bg-[#3A5A40] hover:text-white transition-all duration-200 mt-2"
        >
          Close
        </button>
      </ModalShell>
    </ModalOverlay>
  );
}
