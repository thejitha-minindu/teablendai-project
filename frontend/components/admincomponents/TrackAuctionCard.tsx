"use client";

type TrackAuctionCardProps = {
    auctionName: string;
    estateName: string;
    grade: string;
    quantity: number;
    basePrice: number;
    startTime: string;
    status: string;
    buyer?: string;
    soldPrice?: number;
    customAuctionId?: string;
};

import { Box } from "lucide-react";

export function TrackAuctionCard({ auctionName, estateName, grade, quantity, basePrice, startTime, status, buyer, soldPrice, customAuctionId }: TrackAuctionCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5  mb-5 w-full max-w-full min-w-0 block min-h-48">
            
            {/* TOP ROW */}
            <div className="flex gap-4 items-start">
                {/* Info Icon */}
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                    <Box className="w-4 h-4" />
                </div>

                {/* Content */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">
                        {auctionName}
                    </h3>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p><span className="font-medium">Estate Name :</span> {estateName}</p>
                        <p><span className="font-medium">Grade :</span> {grade}</p>
                        <p><span className="font-medium">Quantity :</span> {quantity}</p>
                        <p><span className="font-medium">Base Price :</span> ${basePrice.toFixed(2)}</p>
                        <p><span className="font-medium">Start Time :</span> {startTime}</p>
                        <p><span className="font-medium">Status :</span> {status}</p>
                        {buyer && (
                            <p><span className="font-medium">Buyer :</span> {buyer}</p>
                    
                        )}
                        {typeof soldPrice === "number" && (
                            <p><span className="font-medium">Sold Price :</span> ${soldPrice.toFixed(2)}</p>
                        )}
                        {customAuctionId && (
                            <p><span className="font-medium">Ref ID :</span> {customAuctionId}</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
