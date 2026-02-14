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
    <div className="flex flex-col gap-6">
      <AuctionLivePreview />
      <LiveAuctionPageCard />
      <LiveBidList />
      <div>
        <div>
          <div className="flex w-full gap-2">
            <Select value={selectedAmount} onValueChange={setSelectedAmount}>
              <SelectTrigger>
                <SelectValue placeholder="Select amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">5000 LKR</SelectItem>
                <SelectItem value="10000">10000 LKR</SelectItem>
                <SelectItem value="15000">15000 LKR</SelectItem>
                <SelectItem value="20000">20000 LKR</SelectItem>
                <SelectItem value="25000">25000 LKR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full gap-2 items-center">
            <div className="flex-1 px-3 py-2 border rounded-md bg-white text-sm">
              Amount: <span id="selected-amount">{selectedAmount || "Select amount"}</span>
            </div>
            <Button variant={"outline"} className="bg-(--color4) text-white">Bid</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
