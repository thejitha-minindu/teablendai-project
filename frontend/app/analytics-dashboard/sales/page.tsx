"use client";

import {
  BarChart, Bar, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Dummy Data
const auctionPerformance = [
  { auction: 'Colombo A1', basePrice: 1100, closingPrice: 1280, volume: 12500, bidCount: 45 },
  { auction: 'Kandy B2', basePrice: 1200, closingPrice: 1350, volume: 9800, bidCount: 38 },
  { auction: 'Galle C1', basePrice: 980, closingPrice: 1120, volume: 8600, bidCount: 32 },
  { auction: 'Nuwara D3', basePrice: 1300, closingPrice: 1480, volume: 11200, bidCount: 52 },
  { auction: 'Uva E2', basePrice: 1150, closingPrice: 1290, volume: 7900, bidCount: 29 },
];

const gradeWisePrices = [
  { grade: 'BOP', minBid: 1050, avgBid: 1220, maxBid: 1420, soldVolume: 14200 },
  { grade: 'BOPF', minBid: 980, avgBid: 1140, maxBid: 1320, soldVolume: 11600 },
  { grade: 'Dust', minBid: 750, avgBid: 910, maxBid: 1080, soldVolume: 8900 },
  { grade: 'OP', minBid: 1200, avgBid: 1410, maxBid: 1650, soldVolume: 5200 },
  { grade: 'Pekoe', minBid: 1350, avgBid: 1580, maxBid: 1820, soldVolume: 2450 },
];

const sellingTrends = [
  { month: 'Jan', revenue: 16.2, volume: 6800, avgPrice: 1200 },
  { month: 'Feb', revenue: 17.8, volume: 7200, avgPrice: 1230 },
  { month: 'Mar', revenue: 18.5, volume: 7500, avgPrice: 1265 },
  { month: 'Apr', revenue: 19.2, volume: 7800, avgPrice: 1285 },
  { month: 'May', revenue: 20.1, volume: 8100, avgPrice: 1310 },
  { month: 'Jun', revenue: 19.6, volume: 7900, avgPrice: 1295 },
];

const sellerPerformance = [
  { seller: 'Premium Exports Ltd', totalSales: 15.8, avgMargin: 24.5, auctionsWon: 28 },
  { seller: 'Ceylon Tea Global', totalSales: 13.2, avgMargin: 22.1, auctionsWon: 24 },
  { seller: 'Island Tea Co.', totalSales: 11.6, avgMargin: 20.8, auctionsWon: 19 },
  { seller: 'Heritage Blends', totalSales: 9.4, avgMargin: 23.2, auctionsWon: 16 },
  { seller: 'Golden Leaf Traders', totalSales: 8.1, avgMargin: 21.5, auctionsWon: 14 },
];

const bidVolumeAnalysis = [
  { auction: 'Colombo A1', totalBids: 456, avgBidIncrement: 45, winningBids: 12 },
  { auction: 'Kandy B2', totalBids: 392, avgBidIncrement: 52, winningBids: 10 },
  { auction: 'Galle C1', totalBids: 328, avgBidIncrement: 38, winningBids: 9 },
  { auction: 'Nuwara D3', totalBids: 512, avgBidIncrement: 58, winningBids: 14 },
  { auction: 'Uva E2', totalBids: 298, avgBidIncrement: 42, winningBids: 8 },
];

export default function SalesAuctionAnalytics() {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales & Auction Performance</h1>
          <p className="text-gray-600 mt-1">Monitor auction results and selling trends</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <MetricCard title="Total Revenue" value="91.4M LKR" change="+15.2%" isPositive />
        <MetricCard title="Avg Closing Price" value="1,304 LKR/kg" change="+3.8%" isPositive />
        <MetricCard title="Auctions Held" value="47" change="+12" isPositive />
        <MetricCard title="Total Bids" value="1,986" change="+8.5%" isPositive />
        <MetricCard title="Avg Time to Sell" value="4.4 days" change="-0.6" isPositive />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auction Performance */}
        <ChartCard title="Auction Performance: Base vs Closing Price">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={auctionPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="auction" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="basePrice" fill="#94a3b8" name="Base Price (LKR/kg)" />
              <Bar dataKey="closingPrice" fill="#0088FE" name="Closing Price (LKR/kg)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grade-wise Price Range */}
        <ChartCard title="Price Range by Tea Grade">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={gradeWisePrices}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="minBid" fill="#cbd5e1" name="Min Bid" />
              <Bar dataKey="avgBid" fill="#0088FE" name="Avg Bid" />
              <Bar dataKey="maxBid" fill="#00C49F" name="Max Bid" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sales Trends */}
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

        {/* Seller Performance */}
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

        {/* Bid Volume Analysis */}
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

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Performance Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade-wise Sales Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Grade</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Sold (kg)</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Avg Price</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Max Price</th>
                </tr>
              </thead>
              <tbody>
                {gradeWisePrices.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.grade}</td>
                    <td className="text-right py-3 px-2">{item.soldVolume.toLocaleString()}</td>
                    <td className="text-right py-3 px-2">{item.avgBid.toLocaleString()} LKR</td>
                    <td className="text-right py-3 px-2 text-green-600 font-medium">
                      {item.maxBid.toLocaleString()} LKR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seller Margins Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Margin Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Seller</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Auctions Won</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Avg Margin</th>
                </tr>
              </thead>
              <tbody>
                {sellerPerformance.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.seller}</td>
                    <td className="text-right py-3 px-2">{item.auctionsWon}</td>
                    <td className="text-right py-3 px-2">
                      <span className="text-green-600 font-medium">{item.avgMargin}%</span>
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

function MetricCard({ title, value, change, isPositive }: { 
  title: string; 
  value: string; 
  change: string;
  isPositive: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{change}</span>
      </div>
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
