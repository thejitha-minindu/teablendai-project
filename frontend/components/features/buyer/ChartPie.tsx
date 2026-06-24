"use client";

import * as React from "react";
import { TrendingUp, Expand, Loader2 } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAnalyticsOverview } from "@/hooks/use-analytics-overview";

export function ChartPie() {
  const { data, loading, error } = useAnalyticsOverview();

  const chartData = React.useMemo(() => {
    if (!data || !data.teaGradeDistribution) return [];
    return data.teaGradeDistribution.map(item => ({
      name: item.name,
      value: item.value,
      fill: item.color
    }));
  }, [data]);

  const totalVolumeKg = React.useMemo(() => {
    if (!data || !data.kpis || !data.kpis.totalSold) return 0;
    return data.kpis.totalSold.value;
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: { label: "Volume" }
    };
    chartData.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.fill
      };
    });
    return config;
  }, [chartData]);

  if (loading && !data) {
    return (
      <Card className="flex flex-col h-full w-full border-gray-100 shadow-sm items-center justify-center min-h-[420px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="flex flex-col h-full w-full border-gray-100 shadow-sm items-center justify-center min-h-[420px] text-red-500 text-sm">
        Failed to load data
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full w-full border-gray-100 shadow-sm min-h-[420px]">
      <CardHeader className="flex flex-row items-center pb-0 justify-between">
          <div className="flex flex-col">
            <Link href="/analytics-dashboard">
              <CardTitle className="text-gray-700 font-bold">Tea Distribution</CardTitle>
              <CardDescription>Live + Scheduled</CardDescription>
            </Link>
          </div>
          <div>
              <Link href="/analytics-dashboard">
                <Expand className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              </Link>
          </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center">
        {chartData.length === 0 ? (
           <div className="text-sm text-gray-500">No data available</div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalVolumeKg.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total Kg
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pb-6">
        <div className="flex items-center gap-2 leading-none font-medium text-gray-700">
          Showing real-time distribution <TrendingUp className="h-4 w-4 text-green-600" />
        </div>
        <div className="text-muted-foreground leading-none">
          Data fetched from analytics overview
        </div>
      </CardFooter>
    </Card>
  );
}
