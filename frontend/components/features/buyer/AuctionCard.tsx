"use client";
import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const commonDetails = {
  auctionName: "Spring Harvest Auction",
  company: "ABC Tea Company",
  date: "2025-10-12",
  estateName: "Darjeeling Estate",
};

const auctionDetails = {
  ...commonDetails,
  time: "10:00 AM",
  quantity: "100 kg",
  grade: "FTGFOP1",
  basePrice: "$500",
};

const historyDetails = {
  ...commonDetails,
  quantity: "100 kg",
  grade: "FTGFOP1",
  basePrice: "$500",
  winner: "John Doe",
  winningBid: "$550",
  soldPrice: "$600",
};

const orderDetails = {
  ...commonDetails,
  quantity: "50 kg",
  grade: "BOP",
  soldPrice: "$250",
  orderId: "ORD123456",

};

import { Button } from "@/components/ui/button";
import { AuctionHistoryDialog } from "@/components/features/buyer/AuctionHistoryDialog";
import { HistoryCardDialog } from "@/components/features/buyer/HistoryCardDialog";
import { OrderCardDialog } from "@/components/features/buyer/OrderCardDialog";

export function AuctionCard( {cardType}: {cardType: "order" | "history" | "auction"} ) {
  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start">
        <div className="flex flex-col">
          <CardTitle>{auctionDetails.auctionName}</CardTitle>
          <CardDescription>(by {auctionDetails.company})</CardDescription>
        </div>
        <div className="flex flex-col items-start lg:items-end text-xs mt-2 sm:mt-0 sm:ml-4 sm:items-start">
          <p>{auctionDetails.date}</p>
            {cardType === "auction" && <p>{auctionDetails.time}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-m font-semibold mb-2">
              {auctionDetails.estateName}
              </h2>
              <p className="mb-1 text-sm">
              <span className="font-medium">Quantity:</span>{" "}
              {auctionDetails.quantity}
              </p>
              <p className="mb-1 text-sm">
              <span className="font-medium">Grade:</span>{" "}
              {auctionDetails.grade}
              </p>
              {(cardType === "history" || cardType === "order") && (
              <p className="mb-1 text-sm">
                <span className="font-medium">Sold Price:</span>{" "}
                {historyDetails.soldPrice}
              </p>
              )}
              {cardType === "auction" && (
              <p className="mb-1 text-sm">
                <span className="font-medium">Base Price:</span>{" "}
                {auctionDetails.basePrice}
              </p>
              )}
              {cardType === "history" && (
              <p className="mb-1 text-sm">
                <span className="font-medium">Winner:</span>{" "}
                {historyDetails.winner}
              </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {cardType === "history" ? (
          <HistoryCardDialog />
        ) : cardType === "order" ? (
          <OrderCardDialog />
        ) : cardType === "auction" ? (
          <Button variant="outline">Place Bid</Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
