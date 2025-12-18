import * as React from "react";

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

const auctionHistoryDetails = {
  auctionName: "Spring Harvest Auction",
  company: "ABC Tea Company",
  date: "2025-10-12",
  estateName: "Darjeeling Estate",
  quantity: "100 kg",
  grade: "FTGFOP1",
  basePrice: "$500",
  winner: "John Doe",
  winningBid: "$550",
  soldPrice: "$600",
};

const bid = [
  { amount: "$550", date: "2025-10-12", time: "11:00 AM" },
  { amount: "$600", date: "2025-10-12", time: "11:30 AM" },
  { amount: "$650", date: "2025-10-12", time: "12:00 PM" },
  { amount: "$700", date: "2025-10-12", time: "12:30 PM" },
  { amount: "$750", date: "2025-10-12", time: "1:00 PM" },
  { amount: "$800", date: "2025-10-12", time: "1:30 PM" },
];

export function HistoryCardDialog() {
  return (
    <Dialog>
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
        <DialogHeader className="pb-4 lg:mb-5">
          <DialogTitle style={{ color: "var(--color4)", fontWeight: "bold" }} className="text-2xl">
            {auctionHistoryDetails.auctionName}
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
                  {auctionHistoryDetails.estateName}
                </h2>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Grade:</span>{" "}
                  {auctionHistoryDetails.grade}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Base Price:</span>{" "}
                  {auctionHistoryDetails.soldPrice}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Quantity:</span>{" "}
                  {auctionHistoryDetails.winner}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Winning Bid:</span>{" "}
                  {auctionHistoryDetails.winningBid}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Sold Price:</span>{" "}
                  {auctionHistoryDetails.soldPrice}
                </p>
              </div>
            </div>

            <div className="flex flex-col h-full items-center sm:items-start text-xs lg:mr-5 mt-0 mb-10">
              <ScrollArea className="h-48 md:h-60 lg:h-75 w-full sm:w-64 md:w-72 lg:w-80 rounded-md border ">
                <div className="p-4">
                  <h4 className="mb-4 text-sm leading-none font-medium">
                    Bids
                  </h4>
                  {bid.map((tag) => (
                    <React.Fragment key={`${tag.date}-${tag.time}`}>
                      <div className="text-sm">
                        Amount: {tag.amount}, Date: {tag.date}, Time: {tag.time}
                      </div>
                      <Separator className="my-2" />
                    </React.Fragment>
                  ))}
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
      </DialogContent>
    </Dialog>
  );
}
