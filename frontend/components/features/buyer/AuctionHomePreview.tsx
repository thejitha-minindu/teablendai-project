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

const auctionDetails = {
  auctionName: "Spring Harvest Auction",
  company: "ABC Tea Company",
  date: "2025-10-12",
  time: "10:00 AM - 12:00 PM",
  estateName: "Darjeeling Estate",
  quantity: "100 kg",
  grade: "FTGFOP1",
  basePrice: "$500",
  imageUrl:
    "https://img.freepik.com/free-photo/front-view-tea-herbal-concept-with-copy-space_23-2148555200.jpg?semt=ais_hybrid&w=740&q=80",
};

import { Button } from "@/components/ui/button";

export function AuctionHomePreview() {
  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start">
        <div className="flex flex-col">
          <CardTitle>{auctionDetails.auctionName}</CardTitle>
          <CardDescription>(by {auctionDetails.company})</CardDescription>
        </div>
        <div className="flex flex-col items-start lg:items-end text-xs mt-2 sm:mt-0 sm:ml-4 sm:items-start">
          <p>{auctionDetails.date}</p>
          <p>{auctionDetails.time}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto">
            <div>
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
              <p className="mb-1 text-sm">
                <span className="font-medium">Base Price:</span>{" "}
                {auctionDetails.basePrice}
              </p>
            </div>
          </div>
          <img
            src={auctionDetails.imageUrl}
            alt={auctionDetails.estateName}
            className="w-full max-w-xs h-32 md:w-30 md:h-30 rounded-sm object-cover ml-0 md:ml-auto mt-4 md:mt-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
