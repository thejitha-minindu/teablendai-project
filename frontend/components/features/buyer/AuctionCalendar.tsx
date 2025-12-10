import React from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface AuctionCalendarProps {
  onDateSelect?: (date: Date) => void;
  onDone?: () => void;
}

const AuctionCalendar: React.FC<AuctionCalendarProps> = ({
  onDateSelect,
  onDone,
}) => {
  return (
    <div className="bg-background border-2 border-(--color2) rounded-2xl p-4 w-full">
      {/* Expand Icon */}
      <div className="flex justify-end mb-3">
        <button
          className="text-(--color2) hover:text-(--color3) transition-colors"
          aria-label="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Container */}
      <div className="bg-white border-2 border-blue-400 rounded-2xl p-4">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-semibold text-gray-800">
            January 2023
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Placeholder */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {/* This will be populated with actual calendar logic */}
          {Array.from({ length: 35 }).map((_, index) => (
            <button
              key={index}
              className="aspect-square flex items-center justify-center text-sm rounded-lg hover:bg-gray-100 transition-colors"
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Done Button */}
        <div className="flex justify-end">
          <button
            onClick={onDone}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionCalendar;
