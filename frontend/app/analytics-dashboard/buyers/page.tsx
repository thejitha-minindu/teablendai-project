"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { useAnalyticsBuyers } from '@/hooks/use-analytics-buyers';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function BuyerBehaviorAnalytics() {
  const { data, loading, error, isStale, lastUpdated } = useAnalyticsBuyers();

  if (loading && !data) {
    return <div className="p-6 text-gray-500">Loading buyer analytics...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">Failed to load buyer analytics: {error ?? 'Unknown error'}</div>;
  }

  const summary = data.summary;
  const buyerSeries = data.buyerSeries;
  const buyerParticipation = data.buyerParticipation;
  const mostActiveBuyers = data.mostActiveBuyers;
  const bidIncrementAnalysis = data.bidIncrementAnalysis;
  const repeatBuyerRate = data.repeatBuyerRate;
  const buyerSegmentation = data.buyerSegmentation;
  const monthlyEngagement = data.monthlyEngagement;

  const demandByGrade = data.demandByGrade.map((item) => ({
    grade: item.grade,
    ...item.buyerDemand,
  }));

  const gradeDemandSeries = buyerSeries.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer & Market Behavior</h1>
          <p className="text-gray-600 mt-1">Analyze buyer patterns and market participation</p>
        </div>
        <div className="text-xs text-right text-gray-500">
          <p>Last update: {new Date(lastUpdated ?? data.generatedAt).toLocaleTimeString()}</p>
          {isStale ? <p className="text-amber-600">Showing last successful snapshot</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <InfoCard title="Total Buyers" value={summary.totalBuyers.toLocaleString()} icon={<Users size={20} />} />
        <InfoCard title="Active Buyers" value={summary.activeBuyers.toLocaleString()} subtitle="This month" />
        <InfoCard title="Avg Participation" value={`${summary.avgParticipation} bids`} subtitle={data.summaryWindowLabel} />
        <InfoCard title="Repeat Rate" value={`${summary.repeatRate.toFixed(1)}%`} icon={<TrendingUp size={20} />} />
        <InfoCard title="New Buyers" value={summary.newBuyersThisMonth.toLocaleString()} subtitle="This month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <ChartCard title="Buyer Demand by Tea Grade">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demandByGrade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip />
              <Legend />
              {gradeDemandSeries.map((buyer, index) => (
                <Bar
                  key={buyer}
                  dataKey={buyer}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  name={buyer}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

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

        <ChartCard title="Buyer Segmentation by Volume">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={buyerSegmentation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ segment, percentage }) => `${String(segment)}: ${Number(percentage).toFixed(1)}%`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {(item.totalBids > 0 ? (item.wonAuctions / item.totalBids) * 100 : 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                    <td className="text-right py-3 px-2">{item.percentage.toFixed(2)}%</td>
                    <td className="text-right py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.contribution > 30 ? 'bg-green-100 text-green-700' : 
                        item.contribution > 15 ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.contribution.toFixed(2)}%
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
