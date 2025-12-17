"use client";

import * as React from "react";
import { TrendingUp, Expand } from "lucide-react";
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

export const description = "A donut chart with text";

const chartData = [
  { browser: "tea1", buyers: 275, fill: "#14532d" }, // dark green
  { browser: "tea2", buyers: 200, fill: "#166534" }, // slightly lighter dark green
  { browser: "tea3", buyers: 287, fill: "#15803d" }, // medium dark green
  { browser: "tea4", buyers: 173, fill: "#16a34a" }, // medium green
  { browser: "tea5", buyers: 190, fill: "#22c55e" }, // vivid green, but not light
];

const chartConfig = {
  buyers: {
    label: "buyers",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function ChartPie() {
  const totalbuyers = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.buyers, 0);
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center pb-0 justify-between">
        <div className="flex flex-col">
          <CardTitle>Tea Distribution</CardTitle>
          <CardDescription>January - June 2025</CardDescription>
        </div>
        <div>
          <Link
            href="/analytics-dashboard">
            <Expand className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="buyers"
              nameKey="browser"
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
                          {totalbuyers.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          buyers
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total buyers for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
