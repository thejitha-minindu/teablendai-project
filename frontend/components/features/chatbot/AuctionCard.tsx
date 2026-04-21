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
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  custom_auction_id?: string;
}

interface AuctionCardProps {
  auction: AuctionData;
  index?: number;
}

// Constants for better maintainability
const STATUS_STYLES = {
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
} as const;

type StatusType = keyof typeof STATUS_STYLES;

// Utility functions
const parseBackendDateTime = (dateString?: string): Date | null => {
  if (!dateString) return null;

  // Handle ISO format with timezone
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  const normalized = dateString.replace(" ", "T");
  const [datePart, timePartRaw = "00:00:00"] = normalized.split("T");
  const timePart = timePartRaw.split(".")[0];

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours = "0", minutes = "0", seconds = "0"] = timePart.split(":");

  return new Date(year, (month || 1) - 1, day || 1, Number(hours), Number(minutes), Number(seconds));
};

const durationToMinutes = (durationValue?: number): number => {
  if (!Number.isFinite(durationValue) || (durationValue ?? 0) <= 0) return 0;
  // If duration is > 24, assume it's already in minutes, otherwise treat as hours
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

export const AuctionCard = React.memo(function AuctionCard({ auction, index }: AuctionCardProps) {
  // Use requestAnimationFrame for better performance
  const [nowMs, setNowMs] = useState<number>(Date.now);

  useEffect(() => {
    let frameId: number;
    let lastTimestamp = Date.now();

    const updateTime = () => {
      const now = Date.now();
      // Only update if enough time has passed (reduce updates)
      if (now - lastTimestamp >= 1000) {
        setNowMs(now);
        lastTimestamp = now;
      }
      frameId = requestAnimationFrame(updateTime);
    };

    frameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Memoize timing calculations
  const timing = useMemo(() => {
    const startDate = parseBackendDateTime(auction.start_time);
    const durationMinutes = durationToMinutes(auction.duration);
    if (!startDate || !durationMinutes) return null;

    const startMs = startDate.getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;
    return { startMs, endMs, startDate, endDate: new Date(endMs) };
  }, [auction.start_time, auction.duration]);

  // Memoize status calculation
  const status = useMemo((): StatusType => {
    if (timing) {
      if (nowMs < timing.startMs) return "Scheduled";
      if (nowMs >= timing.startMs && nowMs < timing.endMs) return "Live";
      return "Complete";
    }

    if (auction.status === "History") return "Complete";
    return (auction.status as StatusType) || "Unknown";
  }, [auction.status, nowMs, timing]);

  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.Unknown;
  const StatusIcon = statusStyle.icon;
  const timeRemaining = timing ? timing.endMs - nowMs : 0;
  const timeUntilStart = timing ? timing.startMs - nowMs : 0;

  // Memoize formatted dates to avoid recalculation on every render
  const formattedStartTime = useMemo(() => {
    if (!auction.start_time) return null;
    return new Date(auction.start_time).toLocaleString();
  }, [auction.start_time]);

  const formattedEndTime = useMemo(() => {
    if (!timing?.endDate) return null;
    return timing.endDate.toLocaleString();
  }, [timing?.endDate]);

  // Determine which status section to show
  const statusSection = useMemo(() => {
    if (!timing) return null;

    if (status === "Live") {
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        title: "Auction Ending Soon!",
        titleColor: "text-red-700",
        subtitle: "Time Remaining",
        subtitleColor: "text-red-600",
        valueColor: "text-red-700",
        value: formatCountdown(timeRemaining),
      };
    }

    if (status === "Scheduled") {
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        title: "Auction Scheduled",
        titleColor: "text-blue-700",
        subtitle: "Starts In",
        subtitleColor: "text-blue-600",
        valueColor: "text-blue-700",
        value: formatCountdown(timeUntilStart),
      };
    }

    return {
      bg: "bg-gray-50",
      border: "border-gray-200",
      title: "Auction Completed",
      titleColor: "text-gray-700",
      subtitle: "Ended at",
      subtitleColor: "text-gray-600",
      valueColor: "text-gray-700",
      value: formattedEndTime,
    };
  }, [status, timing, timeRemaining, timeUntilStart, formattedEndTime]);

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {auction.auction_name || `Auction #${index}`}
            </CardTitle>
            {auction.estate_name && (
              <p className="text-sm text-muted-foreground mt-1">{auction.estate_name}</p>
            )}
          </div>
          <Badge className={`flex items-center gap-1 px-2 py-1 rounded ${statusStyle.bg} ${statusStyle.color}`}>
            <StatusIcon className="w-4 h-4" />
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
                  <p className="text-sm">{formattedStartTime}</p>
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

        {/* Status Section */}
        {statusSection && (
          <>
            <Separator />
            <div className={`rounded-md border ${statusSection.bg} p-3 ${statusSection.border}`}>
              <p className={`text-sm font-semibold ${statusSection.titleColor}`}>{statusSection.title}</p>
              <p className={`text-xs ${statusSection.subtitleColor} mt-1`}>{statusSection.subtitle}</p>
              <p className={`text-lg font-bold ${statusSection.valueColor}`}>{statusSection.value}</p>
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
            {auction.custom_auction_id && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Ref ID:</span> {auction.custom_auction_id}
              </p>
            )}
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
});

AuctionCard.displayName = "AuctionCard";