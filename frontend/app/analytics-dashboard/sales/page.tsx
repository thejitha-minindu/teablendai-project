"use client";

import {
  BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { useAnalyticsSales } from '@/hooks/use-analytics-sales';

export default function SalesAuctionAnalytics() {
  const { data, loading, error, isStale, lastUpdated } = useAnalyticsSales();

  if (loading && !data) {
    return <div className="p-6 text-gray-500">Loading sales analytics...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">Failed to load sales analytics: {error ?? 'Unknown error'}</div>;
  }

  const summary = data.summary;
  const auctionPerformance = data.auctionPerformance;
  const sellingTrends = data.sellingTrends;
  const sellerPerformance = data.sellerPerformance;
  const bidVolumeAnalysis = data.bidVolumeAnalysis;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales & Auction Performance</h1>
          <p className="text-gray-600 mt-1">Monitor auction results and selling trends</p>
        </div>
        <div className="text-xs text-right text-gray-500">
          <p>Last update: {new Date(lastUpdated ?? data.generatedAt).toLocaleTimeString()}</p>
          {isStale ? <p className="text-amber-600">Showing last successful snapshot</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`${(summary.totalRevenueLkr / 1000000)}M LKR`}
          subtitle="Closed auction revenue"
        />
        <MetricCard
          title="Avg Closing Price"
          value={`${summary.averageClosingPriceLkrPerKg.toLocaleString()} LKR/kg`}
          subtitle="Across sold volume"
        />
        <MetricCard
          title="Auctions Held"
          value={summary.auctionsHeld.toLocaleString()}
          subtitle="History status auctions"
        />
        <MetricCard
          title="Total Bids"
          value={summary.totalBids.toLocaleString()}
          subtitle="Bids on sold auctions"
        />
        <MetricCard
          title="Avg Time to Sell"
          value={`${summary.averageTimeToSellDays.toFixed(2)} days`}
          subtitle="From configured duration"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Auction Performance: Base vs Closing Price">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={auctionPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="auction" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="basePrice" fill="#94a3b8" name="Base Price (LKR)" />
              <Bar dataKey="closingPrice" fill="#0088FE" name="Closing Price (LKR)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Sales Revenue & Volume">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={sellingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                fill="#0088FE"
                stroke="#0088FE"
                name="Revenue (M LKR)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="volume"
                stroke="#FF8042"
                strokeWidth={2}
                name="Volume (kg)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Sellers by Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sellerPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="seller" type="category" width={140} fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSales" fill="#00C49F" name="Sales (M LKR)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bid Activity by Auction">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={bidVolumeAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="auction" fontSize={11} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalBids" fill="#8884d8" name="Total Bids" />
              <Line type="monotone" dataKey="winningBids" stroke="#00C49F" strokeWidth={2} name="Winning Bids" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seller Margin Analysis</h3>
            <p className="text-sm text-gray-500">Top performers ranked by total revenue</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-center py-3 px-2 text-gray-600 font-medium w-12">Place</th>
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Seller</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Won Auctions</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Avg Margin %</th>
                </tr>
              </thead>
              <tbody>
                {sellerPerformance.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="text-center py-3 px-2 font-semibold text-blue-600">#{index + 1}</td>
                    <td className="py-3 px-2 font-medium">{item.seller}</td>
                    <td className="text-right py-3 px-2 text-gray-700">{item.auctionsWon}</td>
                    <td className="text-right py-3 px-2">
                      <span className={item.avgMargin >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {item.avgMargin.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
