import * as React from "react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAuctionHistoryDialog } from "@/services/buyer/auctionService";
import { AuctionHistoryDialog } from "@/types/buyer/auction.types";
import { Bid } from "@/types/buyer/bid.types";

interface HistoryCardDialogProps {
  auctionId: string;
}

export function HistoryCardDialog({ auctionId }: HistoryCardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<AuctionHistoryDialog | null>(null);

  useEffect(() => {
    if (isOpen && auctionId) {
      setLoading(true);
      setError(null);
      getAuctionHistoryDialog(auctionId)
        .then((data) => {
          setDialogData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load auction details");
          setLoading(false);
        });
    }
  }, [isOpen, auctionId]);

  const formatBidTime = (bid: Bid) => {
    const date = new Date(bid.bid_time);
    return {
      amount: `${bid.bid_amount} LKR`,
      date: date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
      time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          style={{ transition: "background 0.2s" }}
          className="hover:text-white hover:cursor-pointer"
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color3)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          More
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col lg:p-15 md:p-10 p-6">
        {loading ? (
          <>
            <DialogHeader>
              <DialogTitle>Loading Auction Details</DialogTitle>
              <DialogDescription>Please wait...</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-10">
              <p>Loading...</p>
            </div>
          </>
        ) : error ? (
          <>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
              <DialogDescription>Failed to load auction details</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-10 text-red-500">
              <p>{error}</p>
            </div>
          </>
        ) : dialogData ? (
          <>
            <DialogHeader className="pb-4 lg:mb-5">
              <DialogTitle style={{ color: "var(--color4)", fontWeight: "bold" }} className="text-2xl">
                {dialogData.auction_name}
              </DialogTitle>
              <DialogDescription style={{ color: "var(--color3)"}}>
                Detailed information about your auction history.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-10 h-full">
              <div className="flex flex-col md:flex-row gap-6 sm:items-center lg:items-start h-full">
                <div className="flex flex-row flex-1 w-full md:w-auto justify-center sm:justify-start">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-m font-semibold mb-2">
                      {dialogData.estate_name}
                    </h2>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Grade:</span>{" "}
                      {dialogData.grade}
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Base Price:</span>{" "}
                      {dialogData.base_price} LKR
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Quantity:</span>{" "}
                      {dialogData.quantity} kg
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Winner:</span>{" "}
                      {dialogData.buyer_name || "-"}
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Sold Price:</span>{" "}
                      {dialogData.sold_price ? `${dialogData.sold_price} LKR` : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col h-full items-center sm:items-start text-xs lg:mr-5 mt-0 mb-10">
                  <ScrollArea className="h-48 md:h-60 lg:h-75 w-full sm:w-64 md:w-72 lg:w-80 rounded-md border ">
                    <div className="p-4">
                      <h4 className="mb-4 text-sm leading-none font-medium">
                        Bids
                      </h4>
                      {dialogData.bids && dialogData.bids.length > 0 ? (
                        dialogData.bids.map((bid) => {
                          const formatted = formatBidTime(bid);
                          return (
                            <React.Fragment key={bid.bid_id}>
                              <div className="text-sm">
                                Amount: {formatted.amount}, Date: {formatted.date}, Time: {formatted.time}
                              </div>
                              <Separator className="my-2" />
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">No bids found</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="md:absolute md:left-6 md:bottom-6 lg:absolute lg:left-6 lg:bottom-6 hover:text-white hover:cursor-pointer"
                    style={{ transition: "background 0.2s" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--color3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "")
                    }
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}