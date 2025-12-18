"use client";

type UseractivityCardProps = {
    auctionName: string;
    activityType: string;
    timestamp: string;
};

export function UseractivityCard({ auctionName, activityType, timestamp }: UseractivityCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5  mb-5 w-full max-w-full min-w-0 block min-h-48">

            {/* TOP ROW */}
            <div className="flex gap-8 items-start">
                {/* Info Icon */}
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                    <span className="font-bold">i</span>
                </div>

                {/* Content */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">
                        {auctionName}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Date :{auctionName}</span></p>
                        <p><span className="font-medium">Time :{timestamp}</span></p>
                        <p><span className="font-medium">Activity :{activityType}</span></p>
                    </div>
                </div>
            </div>

        </div>
    );
}
