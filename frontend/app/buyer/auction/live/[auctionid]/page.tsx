"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { AuctionLivePreview } from "@/components/features/buyer/AuctionLivePreview";
import { LiveAuctionPageCard } from "@/components/features/buyer/LiveAuctionPageCard";
import { LiveBidList } from "@/components/features/buyer/LiveBidList";
import { useState } from "react";

export default function BuyerAuctionLivePage({
  params,
}: {
  params: { auctionid: string };
}) {
  const [selectedAmount, setSelectedAmount] = useState<string>("");

  return (
    <div className="h-full">
      <div className="flex flex-col h-full lg:grid lg:grid-cols-3">
        <div className="flex flex-col col-span-2 gap-6">
          <div>
            <AuctionLivePreview />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <LiveAuctionPageCard />
            </div>

            <div className="lg:p-4 space-y-3 flex flex-col items-center justify-center relative z-50">
              <div className="flex flex-col gap-2 w-full">
                <div className="px-3 py-2 border rounded-md bg-white text-sm">
                  Amount:{" "}
                  <span id="selected-amount">
                    {selectedAmount || "Select amount"}
                  </span>
                </div>
                <Button
                  variant={"outline"}
                  className="w-full bg-(--color4) text-white"
                >
                  Bid
                </Button>
              </div>

              <div className="w-full relative">
                <Select
                  value={selectedAmount}
                  onValueChange={setSelectedAmount}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="z-[100]"
                    sideOffset={4}
                  >
                    <SelectItem value="5000">5000 LKR</SelectItem>
                    <SelectItem value="10000">10000 LKR</SelectItem>
                    <SelectItem value="15000">15000 LKR</SelectItem>
                    <SelectItem value="20000">20000 LKR</SelectItem>
                    <SelectItem value="25000">25000 LKR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="h-full">
          <LiveBidList />
        </div>
      </div>
    </div>
  );
}
