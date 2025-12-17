"use client";

type UseractivityCardProps = {
    auctionName: string;
};

export function UseractivityCard({ auctionName }: UseractivityCardProps) {
    return (
        <div className="border-2 border-green-800 rounded-xl p-5 bg-white mb-5">

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

                    <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Date :</span></p>
                        <p><span className="font-medium">Time :</span></p>
                        <p><span className="font-medium">Activity :</span></p>                    </div>
                </div>
            </div>

        </div>
    );
}
