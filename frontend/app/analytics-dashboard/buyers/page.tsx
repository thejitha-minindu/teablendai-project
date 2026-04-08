"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

// Dummy Data
const buyerParticipation = [
  { buyer: 'Global Tea Imports', frequency: 38, totalBids: 456, wonAuctions: 24 },
  { buyer: 'European Tea Co.', frequency: 32, totalBids: 385, wonAuctions: 18 },
  { buyer: 'Asia Premium', frequency: 28, totalBids: 342, wonAuctions: 16 },
  { buyer: 'Middle East Traders', frequency: 24, totalBids: 298, wonAuctions: 12 },
  { buyer: 'Americas Tea House', frequency: 22, totalBids: 267, wonAuctions: 11 },
];

const mostActiveBuyers = [
  { buyer: 'Global Tea Imports', volume: 8600, spend: 11.2, avgBid: 1302 },
  { buyer: 'European Tea Co.', volume: 7200, spend: 9.5, avgBid: 1319 },
  { buyer: 'Asia Premium', volume: 6800, spend: 8.9, avgBid: 1309 },
  { buyer: 'Middle East Traders', volume: 5400, spend: 7.1, avgBid: 1315 },
  { buyer: 'Americas Tea House', volume: 4900, spend: 6.4, avgBid: 1306 },
];

const bidIncrementAnalysis = [
  { buyer: 'Global Tea Imports', avgIncrement: 52, maxIncrement: 125, bidStyle: 'Aggressive' },
  { buyer: 'European Tea Co.', avgIncrement: 45, maxIncrement: 98, bidStyle: 'Moderate' },
  { buyer: 'Asia Premium', avgIncrement: 38, maxIncrement: 82, bidStyle: 'Conservative' },
  { buyer: 'Middle East Traders', avgIncrement: 48, maxIncrement: 110, bidStyle: 'Aggressive' },
  { buyer: 'Americas Tea House', avgIncrement: 42, maxIncrement: 95, bidStyle: 'Moderate' },
];

const demandByGrade = [
  { grade: 'BOP', globalTea: 3200, europeanTea: 2800, asiaPremium: 2600, middleEast: 2100, americas: 1900 },
  { grade: 'BOPF', globalTea: 2600, europeanTea: 2200, asiaPremium: 2100, middleEast: 1700, americas: 1500 },
  { grade: 'Dust', globalTea: 1800, europeanTea: 1500, asiaPremium: 1400, middleEast: 1100, americas: 900 },
  { grade: 'OP', globalTea: 800, europeanTea: 600, asiaPremium: 550, middleEast: 400, americas: 350 },
  { grade: 'Pekoe', globalTea: 200, europeanTea: 100, asiaPremium: 150, middleEast: 100, americas: 250 },
];

const repeatBuyerRate = [
  { month: 'Jan', newBuyers: 5, repeatBuyers: 18, rate: 78 },
  { month: 'Feb', newBuyers: 3, repeatBuyers: 20, rate: 87 },
  { month: 'Mar', newBuyers: 4, repeatBuyers: 19, rate: 83 },
  { month: 'Apr', newBuyers: 2, repeatBuyers: 21, rate: 91 },
  { month: 'May', newBuyers: 6, repeatBuyers: 17, rate: 74 },
  { month: 'Jun', newBuyers: 3, repeatBuyers: 20, rate: 87 },
];

const buyerSegmentation = [
  { segment: 'High Volume', buyers: 8, percentage: 15, contribution: 42 },
  { segment: 'Regular', buyers: 15, percentage: 28, contribution: 38 },
  { segment: 'Occasional', buyers: 20, percentage: 38, contribution: 15 },
  { segment: 'New/Trial', buyers: 10, percentage: 19, contribution: 5 },
];

const monthlyEngagement = [
  { month: 'Jan', activeBuyers: 23, totalBids: 876, avgBidsPerBuyer: 38 },
  { month: 'Feb', activeBuyers: 23, totalBids: 920, avgBidsPerBuyer: 40 },
  { month: 'Mar', activeBuyers: 23, totalBids: 985, avgBidsPerBuyer: 43 },
  { month: 'Apr', activeBuyers: 23, totalBids: 1042, avgBidsPerBuyer: 45 },
  { month: 'May', activeBuyers: 23, totalBids: 1120, avgBidsPerBuyer: 49 },
  { month: 'Jun', activeBuyers: 23, totalBids: 1086, avgBidsPerBuyer: 47 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function BuyerBehaviorAnalytics() {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer & Market Behavior</h1>
          <p className="text-gray-600 mt-1">Analyze buyer patterns and market participation</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <InfoCard title="Total Buyers" value="53" icon={<Users size={20} />} />
        <InfoCard title="Active Buyers" value="23" subtitle="This month" />
        <InfoCard title="Avg Participation" value="38 bids" subtitle="Per buyer" />
        <InfoCard title="Repeat Rate" value="87%" icon={<TrendingUp size={20} />} />
        <InfoCard title="New Buyers" value="3" subtitle="This month" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buyer Participation */}
        <ChartCard title="Buyer Participation Frequency">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buyerParticipation} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="buyer" type="category" width={150} fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="frequency" fill="#0088FE" name="Participation Count" />
              <Bar dataKey="wonAuctions" fill="#00C49F" name="Auctions Won" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Most Active Buyers */}
        <ChartCard title="Top Buyers by Volume & Spend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mostActiveBuyers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="buyer" fontSize={11} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="volume" fill="#0088FE" name="Volume (kg)" />
              <Bar yAxisId="right" dataKey="spend" fill="#00C49F" name="Spend (M LKR)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Demand by Grade */}
        <ChartCard title="Buyer Demand by Tea Grade">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demandByGrade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="globalTea" stackId="a" fill="#0088FE" name="Global Tea Imports" />
              <Bar dataKey="europeanTea" stackId="a" fill="#00C49F" name="European Tea Co." />
              <Bar dataKey="asiaPremium" stackId="a" fill="#FFBB28" name="Asia Premium" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Repeat Buyer Rate */}
        <ChartCard title="New vs Repeat Buyers">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repeatBuyerRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="newBuyers" fill="#FF8042" name="New Buyers" />
              <Bar yAxisId="left" dataKey="repeatBuyers" fill="#00C49F" name="Repeat Buyers" />
              <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#0088FE" strokeWidth={2} name="Repeat Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Buyer Segmentation */}
        <ChartCard title="Buyer Segmentation by Volume">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={buyerSegmentation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="percentage"
              >
                {buyerSegmentation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Engagement */}
        <ChartCard title="Monthly Buyer Engagement Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyEngagement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalBids" stroke="#0088FE" strokeWidth={2} name="Total Bids" />
              <Line type="monotone" dataKey="avgBidsPerBuyer" stroke="#00C49F" strokeWidth={2} name="Avg Bids/Buyer" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bid Increment */}
        <ChartCard title="Average Bid Increment by Buyer">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bidIncrementAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="buyer" fontSize={11} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgIncrement" fill="#8884d8" name="Avg Increment (LKR)" />
              <Bar dataKey="maxIncrement" fill="#FFBB28" name="Max Increment (LKR)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buyer Activity Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Activity Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Buyer</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Total Bids</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Won</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {buyerParticipation.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.buyer}</td>
                    <td className="text-right py-3 px-2">{item.totalBids}</td>
                    <td className="text-right py-3 px-2">{item.wonAuctions}</td>
                    <td className="text-right py-3 px-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {((item.wonAuctions / item.totalBids) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Segmentation Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Segment Contribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Segment</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Count</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">% of Buyers</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Revenue %</th>
                </tr>
              </thead>
              <tbody>
                {buyerSegmentation.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.segment}</td>
                    <td className="text-right py-3 px-2">{item.buyers}</td>
                    <td className="text-right py-3 px-2">{item.percentage}%</td>
                    <td className="text-right py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.contribution > 30 ? 'bg-green-100 text-green-700' : 
                        item.contribution > 15 ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.contribution}%
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

function InfoCard({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        {icon && <div className="text-indigo-600">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
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
