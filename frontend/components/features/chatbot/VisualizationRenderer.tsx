"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import { Download } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface VisualizationRendererProps {
  visualization: string;
  visualizationType: string | null | undefined;
  query?: string;
}

// Constants
const CHART_TYPES = ["bar", "line", "pie"] as const;
const DOWNLOAD_TOOLTIP_SIDE_OFFSET = 8;

// Types
interface TableData {
  columns: string[];
  data: Record<string, unknown>[];
}

interface ChartConfig {
  type?: string;
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function VisualizationRenderer({
  visualization,
  visualizationType,
}: VisualizationRendererProps) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(visualization) as TableData | ChartConfig | null;
    } catch {
      return null;
    }
  }, [visualization]);

  if (!parsed) return null;

  // Determine visualization type
  const type = visualizationType || (parsed as ChartConfig)?.type;

  if (type === "table") {
    return <TableRenderer data={parsed as TableData} />;
  }

  if (CHART_TYPES.includes(type as typeof CHART_TYPES[number])) {
    return <ChartRenderer config={parsed as ChartConfig} />;
  }

  return null;
}

// Download Button Component
function DownloadButton({ onClick, tooltip }: { onClick: () => void; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="
            absolute top-3 right-3 z-10
            p-1.5
            bg-white border border-gray-200 rounded-lg shadow
            opacity-0 group-hover:opacity-100
            pointer-events-none group-hover:pointer-events-auto
            transition-all duration-200 ease-in-out
            hover:bg-gray-50 hover:scale-105
          "
        >
          <Download className="w-5 h-5 text-gray-600 cursor-pointer" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={DOWNLOAD_TOOLTIP_SIDE_OFFSET}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// Table Renderer
function TableRenderer({ data }: { data: TableData }) {
  const { columns = [], data: rows = [] } = data;

  const downloadCSV = useCallback(() => {
    if (!rows.length) return;

    const escapeCSVValue = (value: unknown): string => {
      const stringValue = value ?? "";
      return `"${String(stringValue).replace(/"/g, '""')}"`;
    };

    const csvContent = [
      columns.join(","),
      ...rows.map((row) => 
        columns.map((col) => escapeCSVValue(row[col])).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { 
      type: "text/csv;charset=utf-8;" 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = "table-data.csv";
    link.click();
    
    URL.revokeObjectURL(url);
  }, [columns, rows]);

  if (!rows.length) return null;

  const formatCellValue = (value: unknown): string => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value ? String(value) : "-";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative group">
      <DownloadButton onClick={downloadCSV} tooltip="Download CSV" />
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-emerald-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={`${index}-${column}`}
                    className="px-4 py-2.5 text-gray-700 whitespace-nowrap"
                  >
                    {formatCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Chart Renderer
function ChartRenderer({ config }: { config: ChartConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const downloadChart = useCallback(() => {
    if (!canvasRef.current) return;

    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    
    link.href = url;
    link.download = "chart.png";
    link.click();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeChart = async () => {
      const { Chart, registerables } = await import("chart.js");
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const existingScales = (config.options?.scales || {}) as Record<string, any>;
      const hasYAxis = Object.keys(existingScales).some((key) => key.startsWith("y"));

      const mergedScales: Record<string, any> = {
        ...existingScales,
        x: {
          ...existingScales.x,
          ticks: {
            ...existingScales.x?.ticks,
            font: { size: 11 }
          }
        }
      };

      if (hasYAxis) {
        Object.keys(existingScales)
          .filter((key) => key.startsWith("y"))
          .forEach((key) => {
            mergedScales[key] = {
              ...existingScales[key],
              ticks: {
                ...existingScales[key]?.ticks,
                font: { size: 11 }
              }
            };
          });
      } else {
        mergedScales.y = {
          ...existingScales.y,
          beginAtZero: true,
          ticks: {
            ...existingScales.y?.ticks,
            font: { size: 11 }
          }
        };
      }

      const chartConfig = {
        ...config,
        options: {
          ...config.options,
          responsive: true,
          maintainAspectRatio: false,
          // Enhanced legend & scales for grouped bar charts
          plugins: {
            ...config.options?.plugins,
            legend: {
              ...config.options?.plugins?.legend,
              position: "top",
              labels: {
                padding: 15,
                font: { size: 12, weight: "500" },
                usePointStyle: true,
                pointStyle: "rect"
              }
            }
          },
          scales: mergedScales
        },
      };

      chartRef.current = new Chart(
        canvasRef.current!,
        chartConfig as any
      );
    };

    initializeChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [config]);

  const isPieChart = config.type === "pie";
  // Adjust height for charts with multiple datasets (grouped bars need more space)
  const datasetCount = config.data?.datasets?.length || 1;
  const chartHeight = datasetCount > 2 ? "h-[450px]" : "h-96";
  const containerSize = isPieChart ? "w-[400px] h-[400px]" : `w-full ${chartHeight}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group">
      <DownloadButton onClick={downloadChart} tooltip="Download Chart" />
      
      <div className={`relative mx-auto ${containerSize}`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// Type for Chart.js instance
type Chart = {
  destroy: () => void;
};