import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { Separator } from "@/components/ui/separator";

export function LiveBidList() {
    const dialogData = {
        bids: [
            { bid_id: 1, amount: 100, date: "2024-01-15", time: "10:30 AM" },
            { bid_id: 2, amount: 150, date: "2024-01-15", time: "10:35 AM" },
            { bid_id: 3, amount: 200, date: "2024-01-15", time: "10:40 AM" },
        ],
    };

    const formatBidTime = (bid: any) => ({
        amount: bid.amount,
        date: bid.date,
        time: bid.time,
    });

    return (
        <div className="flex flex-col h-full items-center sm:items-start text-xs lg:mr-5 mt-0 mb-10">
            <ScrollArea className="h-48 md:h-60 lg:h-75 w-full sm:w-64 md:w-72 lg:w-80 rounded-md border ">
                <div className="p-4">
                    <h4 className="mb-4 text-sm leading-none font-medium">Bids</h4>
                    {dialogData.bids && dialogData.bids.length > 0 ? (
                        dialogData.bids.map((bid) => {
                            const formatted = formatBidTime(bid);
                            return (
                                <React.Fragment key={bid.bid_id}>
                                    <div className="text-sm">
                                        Amount: {formatted.amount}, Date: {formatted.date}, Time:{" "}
                                        {formatted.time}
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
    );
}
