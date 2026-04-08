"use client";
import * as React from "react";
import '@/app/globals.css';
import { useEffect, useState } from "react";
import { getHomePreviewAuctions } from "@/services/buyer/auctionService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthClaims } from "@/lib/auth";

const UserId = getAuthClaims()?.id;

export function AuctionLivePreview() {

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start">
        <div className="flex flex-col">
          <CardTitle style={{ color: "var(--color4)", fontWeight: "bold", fontSize: "1.25rem" }}>
            Status: Live
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto gap-3">
            <div>
              <p className="mb-1 text-md">
                <span className="font-medium">Total Bids:</span> 10
              </p>
              <p className="mb-1 text-md">
                <span className="font-medium">Highest Bid:</span> 150,000 LKR
              </p>
              <p className="mb-1 text-md">
                <span className="font-medium">Base Price:</span> 100,000 LKR
              </p>
            </div>
            <div>
              <p className="mb-1 text-md">
                <span className="font-medium">Your Bids:</span> 2h 30m
              </p>
              <p className="mb-1 text-md">
                <span className="font-medium">Your Highest Bids:</span> 2h 30m
              </p>
            </div>
            <div>
              <p className="mb-1 text-md">
                <span className="font-medium">Remaining Time:</span> 2h 30m
              </p>
            </div>
          </div>
          {true ? (
            <img
              src={"https://placekitten.com/300/200"}
              alt={"Auction Image"}
              className="w-full max-w-xs h-32 md:w-30 md:h-30 rounded-sm object-cover ml-0 md:ml-auto mt-4 md:mt-0"
            />
          ) : (
            <span className="w-full max-w-xs h-32 flex items-center justify-center border rounded-sm ml-0 md:ml-auto mt-4 md:mt-0 text-gray-500 bg-gray-100">
              No image
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
