"use client";

import { useEffect, useState } from "react";
import { TrackAuctionCard } from "@/components/admincomponents/TrackAuctionCard";

type Auction = {
    auction_id: string;
    auction_name: string;
    estate_name: string;
    grade: string;
    quantity: number;
    base_price: number;
    start_time: string;
    status: string;
    buyer?: string;
    sold_price?: number;
    custom_auction_id?: string;
};

export default function TrackAuctionPage() {

    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchAuctions = async () => {
            try {

                const res = await fetch("http://localhost:8000/api/v1/admin/auctions");
                const data = await res.json();

                console.log("API DATA:", data);

                setAuctions(Array.isArray(data) ? data : data.auctions || []);

            } catch (error) {

                console.error("Error fetching auctions:", error);

            } finally {

                setLoading(false);

            }
        };

        fetchAuctions();

    }, []);

    if (loading) {
        return (
            <div className="p-6 text-gray-500">
                Loading auctions...
            </div>
        );
    }

    return (
        <div className="flex flex-col p-6">

            <h1 className="text-2xl font-semibold mb-6">
                Track Auctions
            </h1>

            {auctions.length === 0 ? (
                <p className="text-gray-500">
                    No auctions found
                </p>
            ) : (

                auctions.map((auction) => (
                    <TrackAuctionCard
                        key={auction.auction_id}
                        auctionName={auction.auction_name}
                        estateName={auction.estate_name}
                        grade={auction.grade}
                        quantity={auction.quantity}
                        basePrice={auction.base_price}
                        startTime={auction.start_time}
                        status={auction.status}
                        buyer={auction.buyer}
                        soldPrice={auction.sold_price}
                        customAuctionId={auction.custom_auction_id}
                    />
                ))

            )}

        </div>
    );
}