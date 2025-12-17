import { TrackAuctionCard } from "@/components/admincomponents/TrackAuctionCard";

export default function TrackAuctionPage() {
    return (
        <div className="flex flex-col p-6">
            <TrackAuctionCard auctionName="XXXXXX Auction" createdDetails="xxxxxxxxxsu" bidedDetails="4" wonDetails="xxxxxxxxxbu" paymentDetails="pending" />
            <TrackAuctionCard auctionName="XXXXXX Auction" createdDetails="xxxxxxxxxsu" bidedDetails="4" wonDetails="xxxxxxxxxbu" paymentDetails="pending" />
            <TrackAuctionCard auctionName="XXXXXX Auction" createdDetails="xxxxxxxxxsu" bidedDetails="4" wonDetails="xxxxxxxxxbu" paymentDetails="pending" />
            <TrackAuctionCard auctionName="XXXXXX Auction" createdDetails="xxxxxxxxxsu" bidedDetails="4" wonDetails="xxxxxxxxxbu" paymentDetails="pending" />
        </div>
    );
}
