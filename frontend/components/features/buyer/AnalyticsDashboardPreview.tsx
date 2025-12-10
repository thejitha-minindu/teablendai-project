import React from "react";
import { Maximize2 } from "lucide-react";

interface AnalyticsDashboardPreviewProps {
  title?: string;
  subtitle?: string;
}

const AnalyticsDashboardPreview: React.FC<AnalyticsDashboardPreviewProps> = ({
  title = "Sessions",
  subtitle = "Monthly Tea Price\n(by Distric)",
}) => {
  return (
    <div className="bg-background border-2 border-(--color2) rounded-2xl p-4 w-full shadow-sm">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-semibold text-(--color4) m-0">
          {title}
        </h3>
        <button
          className="text-(--color2) hover:text-(--color3) transition-colors"
          aria-label="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chart/Content Area */}
      <div className="bg-white rounded-xl p-4 mb-3 min-h-[140px] flex items-center justify-center">
        {/* Chart placeholder */}
        <div className="text-center">
          <div className="w-28 h-28 rounded-full border-6 border-gray-200 mx-auto mb-2 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-(--color4)">2,998</div>
              <div className="text-xs text-gray-500">Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="pt-3 border-t border-gray-200">
        <h4 className="text-base font-bold text-(--color2) m-0">
          {subtitle.split('\n')[0]}
        </h4>
        <p className="text-xs text-(--color3) font-medium m-0 mt-0.5">
          {subtitle.split('\n')[1]}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPreview;
