import { TrackAuctionCard } from "@/components/admincomponents/TrackAuctionCard";

export default function TrackAuctionPage() {
    const teaAuctions = [
        {
            auctionName: "Darjeeling First Flush 2024",
            createdDetails: "Tea Estate: Margaret's Hope",
            bidedDetails: "12",
            wonDetails: "Apex Tea Traders",
            paymentDetails: "completed"
        },
        {
            auctionName: "Assam Golden Tips",
            createdDetails: "Tea Estate: Halmari",
            bidedDetails: "8",
            wonDetails: "Global Tea Exporters",
            paymentDetails: "processing"
        },
        {
            auctionName: "Ceylon Silver Needle",
            createdDetails: "Sri Lankan Tea Board",
            bidedDetails: "15",
            wonDetails: "Luxury Tea House",
            paymentDetails: "completed"
        },
        {
            auctionName: "Japanese Matcha Ceremonial Grade",
            createdDetails: "Uji Tea Farm, Kyoto",
            bidedDetails: "6",
            wonDetails: "Zen Tea Masters",
            paymentDetails: "pending"
        },
        {
            auctionName: "Chinese Dragon Well Green Tea",
            createdDetails: "West Lake, Hangzhou",
            bidedDetails: "9",
            wonDetails: "Imperial Tea Company",
            paymentDetails: "completed"
        },
        {
            auctionName: "Taiwan High Mountain Oolong",
            createdDetails: "Ali Mountain Tea Farm",
            bidedDetails: "7",
            wonDetails: "Mountain Breeze Traders",
            paymentDetails: "processing"
        },
        {
            auctionName: "Kenyan Purple Tea",
            createdDetails: "Nandi Hills Estate",
            bidedDetails: "5",
            wonDetails: "African Tea Collective",
            paymentDetails: "pending"
        },
        {
            auctionName: "Nepalese Ilam Tea",
            createdDetails: "Ilam Tea Cooperative",
            bidedDetails: "10",
            wonDetails: "Himalayan Tea Imports",
            paymentDetails: "completed"
        },
        {
            auctionName: "Vietnamese Lotus Green Tea",
            createdDetails: "Thai Nguyen Province",
            bidedDetails: "4",
            wonDetails: "Lotus Blossom Traders",
            paymentDetails: "pending"
        },
        {
            auctionName: "Georgian Black Tea",
            createdDetails: "Guria Region Estate",
            bidedDetails: "3",
            wonDetails: "Eastern European Tea Co.",
            paymentDetails: "completed"
        }
    ];

    return (
        <div className="flex flex-col p-6">
            {teaAuctions.map((auction, index) => (
                <TrackAuctionCard
                    key={index}
                    auctionName={auction.auctionName}
                    createdDetails={auction.createdDetails}
                    bidedDetails={auction.bidedDetails}
                    wonDetails={auction.wonDetails}
                    paymentDetails={auction.paymentDetails}
                />
            ))}
        </div>
    );
}