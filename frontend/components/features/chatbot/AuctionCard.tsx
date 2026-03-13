"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  TrendingUpIcon,
  UserIcon,
  Circle,
  Calendar,
  CheckCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface AuctionData {
  auction_id?: string;
  auction_name?: string;
  grade?: string;
  quantity?: number;
  origin?: string;
  base_price?: number;
  status?: string;
  start_time?: string;
  duration?: number;
  description?: string;
  seller_brand?: string;
  estate_name?: string;
  company_name?: string;
}

interface AuctionCardProps {
  auction: AuctionData;
  index?: number;
}

const parseBackendDateTime = (dateString?: string): Date | null => {
  if (!dateString) return null;

  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  const normalized = dateString.replace(" ", "T");
  const [datePart, timePartRaw = "00:00:00"] = normalized.split("T");
  const timePart = timePartRaw.split(".")[0];

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours = "0", minutes = "0", seconds = "0"] = timePart.split(":");

  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
};

const durationToMinutes = (durationValue?: number): number => {
  if (!Number.isFinite(durationValue) || (durationValue ?? 0) <= 0) return 0;
  return (durationValue as number) > 24 ? Math.round(durationValue as number) : Math.round((durationValue as number) * 60);
};

const formatCountdown = (milliseconds: number): string => {
  if (milliseconds <= 0) return "00:00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatDuration = (durationValue?: number): string => {
  const totalMinutes = durationToMinutes(durationValue);
  if (!totalMinutes) return "N/A";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!minutes) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (!hours) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
};

export function AuctionCard({ auction, index }: AuctionCardProps) {
  const [nowMs, setNowMs] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timing = useMemo(() => {
    const startDate = parseBackendDateTime(auction.start_time);
    const durationMinutes = durationToMinutes(auction.duration);
    if (!startDate || !durationMinutes) return null;

    const startMs = startDate.getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;
    return { startMs, endMs, startDate, endDate: new Date(endMs) };
  }, [auction.start_time, auction.duration]);

  const status = useMemo(() => {
    if (timing) {
      if (nowMs < timing.startMs) return "Scheduled";
      if (nowMs >= timing.startMs && nowMs < timing.endMs) return "Live";
      return "Complete";
    }

    if (auction.status === "History") return "Complete";
    return auction.status || "Unknown";
  }, [auction.status, nowMs, timing]);

  // Status icon and color mapping
  const statusStyles: Record<
    string,
    { icon: React.ElementType; color: string; bg: string }
  > = {
    Live: {
      icon: Circle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    Scheduled: {
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    History: {
      icon: CheckCircle,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    Complete: {
      icon: CheckCircle,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    Unknown: {
      icon: Circle,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  };

  const { icon: StatusIcon, color, bg } = statusStyles[status] || statusStyles.Unknown;
  const timeRemaining = timing ? timing.endMs - nowMs : 0;
  const timeUntilStart = timing ? timing.startMs - nowMs : 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {auction.auction_name || `Auction #${index}`}
            </CardTitle>
            {auction.estate_name && (
              <p className="text-sm text-muted-foreground mt-1">
                {auction.estate_name}
              </p>
            )}
          </div>
          <Badge className={`flex items-center gap-1 px-2 py-1 rounded ${bg} ${color}`}>
            {React.createElement(StatusIcon, { className: "w-4 h-4" })}
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Grade & Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Grade</p>
              <p className="font-semibold">{auction.grade}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-semibold">{auction.quantity} kg</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Origin & Price */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Origin</p>
              <p className="font-semibold">{auction.origin}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Starting Price</p>
            <p className="font-semibold text-green-600">
              LKR {auction.base_price?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Time & Duration */}
        {auction.start_time && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Time</p>
                  <p className="text-sm">
                    {new Date(auction.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              {auction.duration && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm">{formatDuration(auction.duration)}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {timing && status === "Live" && (
          <>
            <Separator />
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">Auction Ending Soon!</p>
              <p className="text-xs text-red-600 mt-1">Time Remaining</p>
              <p className="text-lg font-bold text-red-700">{formatCountdown(timeRemaining)}</p>
            </div>
          </>
        )}

        {timing && status === "Scheduled" && (
          <>
            <Separator />
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-700">Auction Scheduled</p>
              <p className="text-xs text-blue-600 mt-1">Starts In</p>
              <p className="text-lg font-bold text-blue-700">{formatCountdown(timeUntilStart)}</p>
            </div>
          </>
        )}

        {timing && status === "Complete" && (
          <>
            <Separator />
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-700">Auction Completed</p>
              <p className="text-xs text-gray-600 mt-1">
                Ended at {timing.endDate.toLocaleString()}
              </p>
            </div>
          </>
        )}

        {/* Description */}
        {auction.description && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{auction.description}</p>
            </div>
          </>
        )}

        {/* Seller Info */}
        {auction.seller_brand && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Seller</p>
                <p className="text-sm font-medium">{auction.seller_brand}</p>
              </div>
            </div>
          </>
        )}

        {/* Auction ID */}
        {auction.auction_id && (
        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground">
            ID: {auction.auction_id}
          </p>
          <Link
            href={`http://localhost:3000/seller/scheduled?auction_id=${auction.auction_id}`}
            className="inline-flex items-center text-sm font-medium text-[#558332] hover:text-[#4a722c] hover:underline"
            target="_blank"
          >
            View Auction
          </Link>
        </div>
      )}
      </CardContent>
    </Card>
  );
}