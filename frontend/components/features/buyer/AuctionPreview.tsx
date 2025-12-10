import React from "react";

interface AuctionPreviewProps {
  auctionTitle: string;
  company: string;
  date: string;
  time: string;
  estateName?: string;
  grade?: string;
  quantity?: string;
  reservePrice?: string;
  imageUrl?: string;
}

const AuctionPreview: React.FC<AuctionPreviewProps> = ({
  auctionTitle,
  company,
  date,
  time,
  estateName = "",
  grade = "",
  quantity = "",
  reservePrice = "",
  imageUrl = "",
}) => {
  return (
    <div 
      className="bg-background border-2 border-(--color2) rounded-2xl p-4 flex gap-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-0.5"
      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
    >
      <div className="flex-1 flex flex-col gap-3">
        {/* Header Section */}
        <div className="flex justify-between items-start pb-2 border-b border-(--color2)">
          <div>
            <h2 className="text-xl font-bold text-(--color3) m-0 leading-tight">
              {auctionTitle}
            </h2>
            <p className="text-sm text-(--color3) font-semibold mt-0.5 mb-0">
              (by {company})
            </p>
          </div>
          <div className="text-right flex flex-col gap-0.5">
            <div className="text-base font-bold text-(--color3)">
              {date}
            </div>
            <div className="text-sm font-semibold text-(--color3)">
              {time}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-(--color2) min-w-[100px]">
              Estate Name:
            </span>
            <span className="text-(--color4) font-normal">
              {estateName || "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-(--color2) min-w-[100px]">
              Grade:
            </span>
            <span className="text-(--color4) font-normal">
              {grade || "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-(--color2) min-w-[100px]">
              Quantity:
            </span>
            <span className="text-(--color4) font-normal">
              {quantity || "—"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-(--color2) min-w-[100px]">
              Reserve Price:
            </span>
            <span className="text-(--color4) font-normal">
              {reservePrice || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="flex items-center justify-center min-w-[180px]">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Auction" 
            className="w-[180px] h-[120px] object-cover rounded-lg border-2 border-(--color2) bg-white"
          />
        ) : (
          <div className="w-[180px] h-[120px] flex items-center justify-center rounded-lg border-2 border-(--color4) bg-background">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 120 80"
              className="w-full h-full text-(--color4) opacity-60"
            >
              <rect
                x="2"
                y="2"
                width="116"
                height="76"
                rx="6"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              <polyline
                points="10,70 40,40 70,60 110,20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="100" cy="20" r="6" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionPreview;
