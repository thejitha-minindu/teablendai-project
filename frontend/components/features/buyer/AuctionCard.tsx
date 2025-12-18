"use client";
import * as React from "react";
import '@/app/globals.css';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryCardDialog } from "@/components/features/buyer/HistoryCardDialog";
import { OrderCardDialog } from "@/components/features/buyer/OrderCardDialog";


export type CardType = "order" | "history" | "auction";

export interface AuctionDetails {
  title: string;
  company: string;
  date: string;
  estateName: string;
  quantity?: string;
  grade?: string;
  basePrice?: string;
  time?: string;
  soldPrice?: string;
  winner?: string;
}

export interface AuctionCardProps {
  cardType: CardType;
  auction?: AuctionDetails;
}

const getDefaultAuction = (cardType: CardType): AuctionDetails => ({
  title: cardType === "auction" ? "Live Auction" : "Auction",
  company: "Not specified",
  date: new Date().toISOString().split("T")[0],
  estateName: "Not specified",
  quantity: "0 kg",
  grade: "N/A",
  basePrice: "$0",
  ...(cardType === "auction" && { time: "TBD" }),
});

export function AuctionCard({ cardType, auction }: AuctionCardProps) {
  const safeAuction = auction || getDefaultAuction(cardType);

  const renderAuctionDetails = () => (
    <div className="flex flex-col gap-2">
      <h2 className="text-m font-semibold mb-2">
      {safeAuction.estateName}
      </h2>
      <p className="mb-1 text-sm">
      <span className="font-medium">Quantity:</span>{" "}
      {safeAuction.quantity}
      </p>
      <p className="mb-1 text-sm">
      <span className="font-medium">Grade:</span>{" "}
      {safeAuction.grade}
      </p>
      {(cardType === "history" || cardType === "order") && (
      <p className="mb-1 text-sm">
        <span className="font-medium">Sold Price:</span>{" "}
        {auction?.soldPrice}
      </p>
      )}
      {cardType === "auction" && (
      <p className="mb-1 text-sm">
        <span className="font-medium">Base Price:</span>{" "}
        {safeAuction.basePrice}
      </p>
      )}
      {cardType === "history" && (
      <p className="mb-1 text-sm">
        <span className="font-medium">Winner:</span>{" "}
        {auction?.winner}
      </p>
      )}
    </div>
  );

  const renderFooterButton = () => {
    switch (cardType) {
      case "history":
        return <HistoryCardDialog />;
      case "order":
        return <OrderCardDialog />;
      case "auction":
        return (
          <Button
            variant="outline"
            style={{ transition: "background 0.2s" }}
            className="hover:text-white hover:cursor-pointer"
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color3)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
          >
            Place Bid
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4">
        <div className="flex flex-col">
          <CardTitle style={{ color: "var(--color4)", fontWeight: "bold" }}>{safeAuction.title}</CardTitle>
          <CardDescription style={{ color: "var(--color3)" }}>(by {safeAuction.company})</CardDescription>
        </div>
        <div className="flex flex-col items-start sm:items-end text-sm text-muted-foreground">
          <p>{safeAuction.date}</p>
          {cardType === "auction" && safeAuction.time && (
            <p>{safeAuction.time}</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto gap-5">
            {renderAuctionDetails()}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {renderFooterButton()}
      </CardFooter>
    </Card>
  );
}
