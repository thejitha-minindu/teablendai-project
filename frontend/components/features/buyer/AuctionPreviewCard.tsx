import React from "react";

interface AuctionPreviewCardProps {
  auctionTitle: string;
  company: string;
  description: string;
  date: string;
  time: string;
  onBidClick?: () => void;
}

const AuctionPreviewCard: React.FC<AuctionPreviewCardProps> = ({
  auctionTitle,
  company,
  description,
  date,
  time,
  onBidClick,
}) => {
  return (
    <div className="bg-background border-2 border-(--color2) rounded-2xl p-6 flex flex-col gap-4 w-full max-w-[280px] shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-(--color3) leading-tight m-0">
          {auctionTitle}
        </h3>
        <p className="text-sm text-(--color3) font-medium m-0">
          (by {company})
        </p>
      </div>

      {/* Description */}
      <div className="flex-1">
        <p className="text-sm text-(--color2) leading-relaxed m-0">
          {description}
        </p>
      </div>

      {/* Footer with Date/Time and BID button */}
      <div className="flex justify-between items-center pt-3 border-t border-(--color2)">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-(--color3)">
            {date}
          </span>
          <span className="text-xs font-semibold text-(--color3)">
            {time}
          </span>
        </div>
        <button
          onClick={onBidClick}
          className="bg-(--color3) hover:bg-(--color4) text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 text-sm uppercase tracking-wide shadow-sm hover:shadow-md"
        >
          BID
        </button>
      </div>
    </div>
  );
};

export default AuctionPreviewCard;
