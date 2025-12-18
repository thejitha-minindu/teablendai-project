"use client";

type TrackAuctionCardProps = {
    auctionName: string;
    createdDetails?: string;
    bidedDetails?: string;
    wonDetails?: string;
    paymentDetails?: string;
};

export function TrackAuctionCard({ auctionName, createdDetails, bidedDetails, wonDetails, paymentDetails }: TrackAuctionCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5  mb-5 w-full max-w-full min-w-0 block min-h-48">

            {/* TOP ROW */}
            <div className="flex gap-4 items-start">
                {/* Info Icon */}
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                    <span className="font-bold">i</span>
                </div>

                {/* Content */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">
                        {auctionName}
                    </h3>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p><span className="font-medium">Created Details :</span> {createdDetails}</p>
                        <p><span className="font-medium">Bided Details :</span> {bidedDetails}</p>
                        <p><span className="font-medium">Won Details :</span> {wonDetails}</p>
                        <p><span className="font-medium">Payment Details :</span> {paymentDetails}</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
