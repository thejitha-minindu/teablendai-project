"use client";
import * as React from "react";
import '@/app/globals.css';
import { useEffect, useState } from "react";
import { getHomePreviewAuctions } from "@/services/buyer/auctionService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const userId = "user_002";

export function AuctionHomePreview() {
  const [auction, setAuction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getHomePreviewAuctions(userId)
      .then((data) => {
        setAuction(data && data.length > 0 ? data[0] : null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load auction preview");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!auction) return <div>No auction preview available.</div>;

  // Fallback for image
  const imageUrl = auction.image_url || null;

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start">
        <div className="flex flex-col">
          <CardTitle style={{ color: "var(--color4)", fontWeight: "bold" }}>
            {auction.auction_name || "Auction"}
          </CardTitle>
          <CardDescription style={{ color: "var(--color3)" }}>
            (by {auction.company_name || "Unknown Company"})
          </CardDescription>
        </div>
        <div className="flex flex-col items-start lg:items-end text-xs mt-2 sm:mt-0 sm:ml-4 sm:items-start">
          <p>{auction.date ? new Date(auction.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-"}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto">
            <div>
              <h2 className="text-m font-semibold mb-2">
                {auction.estate_name || "-"}
              </h2>
              <p className="mb-1 text-sm">
                <span className="font-medium">Quantity:</span> {auction.quantity ?? "-"} kg
              </p>
              <p className="mb-1 text-sm">
                <span className="font-medium">Grade:</span> {auction.grade ?? "-"}
              </p>
              <p className="mb-1 text-sm">
                <span className="font-medium">Base Price:</span> {auction.base_price ? `${auction.base_price} LKR` : "-"}
              </p>
            </div>
          </div>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={auction.estate_name || "Auction Image"}
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
