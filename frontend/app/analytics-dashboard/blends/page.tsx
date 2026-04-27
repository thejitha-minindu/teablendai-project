"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Award } from 'lucide-react';
import { useAnalyticsBlends } from '@/hooks/use-analytics-blends';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function BlendPerformanceAnalytics() {
  const { data, loading, error, isStale, lastUpdated } = useAnalyticsBlends();

  if (loading && !data) {
    return <div className="p-6 text-gray-500">Loading blend analytics...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">Failed to load blend analytics: {error ?? 'Unknown error'}</div>;
  }

  const summary = data.summary;
  const blendSeries = data.blendSeries;
  const compositionStandards = data.compositionStandards;
  const blendProfitability = data.blendProfitability;
  const blendMarketShare = data.blendMarketShare;
  const annualComparison = data.annualComparison;

  const blendComposition = data.blendComposition.map((item) => ({
    blend: item.blend,
    ...item.ratios,
  }));

  const monthlyBlendPerformance = data.monthlyBlendPerformance.map((item) => ({
    month: item.month,
    ...item.revenues,
  }));

  const profitMarginTrend = data.profitMarginTrend.map((item) => ({
    month: item.month,
    ...item.margins,
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blend Performance & Profitability</h1>
          <p className="text-gray-600 mt-1">Analyze blend composition and financial metrics</p>
        </div>
        <div className="text-xs text-right text-gray-500">
          <p>Last update: {new Date(lastUpdated ?? data.generatedAt).toLocaleTimeString()}</p>
          {isStale ? <p className="text-amber-600">Showing last successful snapshot</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <HighlightCard
          title="Total Blends"
          value={summary.totalBlends.toLocaleString()}
          subtitle="Active blends in window"
        />
        <HighlightCard
          title="Avg Profit Margin"
          value={`${summary.averageProfitMarginPct.toFixed(2)}%`}
          subtitle="Weighted gross margin"
        />
        <HighlightCard
          title="Best Performer"
          value={summary.bestPerformerBlend}
          subtitle={`${summary.bestPerformerMarginPct.toFixed(2)}% margin`}
        />
        <HighlightCard
          title="Total Blend Revenue"
          value={`${(summary.totalBlendRevenueLkr / 1_000_000)}M LKR`}
          subtitle={data.summaryWindowLabel}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Blend Composition by Tea Grade">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={blendComposition}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="blend" fontSize={11} />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {compositionStandards.map((standard, index) => (
                <Bar
                  key={standard}
                  dataKey={standard}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  name={standard}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost vs Selling Price Analysis">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={blendProfitability}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="blend" fontSize={11} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cost" fill="#94a3b8" name="Cost (LKR/kg)" />
              <Bar dataKey="sellPrice" fill="#00C49F" name="Sell Price (LKR/kg)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Revenue by Blend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyBlendPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Revenue (M LKR)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {blendSeries.map((blend, index) => (
                <Line
                  key={blend}
                  type="monotone"
                  dataKey={blend}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={blend}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Market Share by Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={blendMarketShare}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ blend, share }) => `${String(blend)}: ${Number(share).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="share"
              >
                {blendMarketShare.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit Margin Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitMarginTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {blendSeries.map((blend, index) => (
                <Line
                  key={blend}
                  type="monotone"
                  dataKey={blend}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={blend}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Year-over-Year Revenue Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={annualComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="blend" fontSize={11} />
              <YAxis label={{ value: 'Revenue (M LKR)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="previousYearRevenue" fill="#94a3b8" name={String(data.annualPreviousYear)} />
              <Bar dataKey="currentYearRevenue" fill="#0088FE" name={String(data.annualCurrentYear)} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blend Profitability Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Blend</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Cost</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Price</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Margin</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {blendProfitability.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.blend}</td>
                    <td className="text-right py-3 px-2">{item.cost.toLocaleString()} LKR/kg</td>
                    <td className="text-right py-3 px-2">{item.sellPrice.toLocaleString()} LKR/kg</td>
                    <td className="text-right py-3 px-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {item.margin.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">{item.revenue.toFixed(2)}M LKR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Growth Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Blend</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">{data.annualPreviousYear}</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">{data.annualCurrentYear}</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody>
                {annualComparison.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.blend}</td>
                    <td className="text-right py-3 px-2">{item.previousYearRevenue.toFixed(2)}M</td>
                    <td className="text-right py-3 px-2 font-semibold">{item.currentYearRevenue.toFixed(2)}M</td>
                    <td className="text-right py-3 px-2">
                      <span className={`${item.growth >= 0 ? 'text-green-600' : 'text-red-600'} font-medium flex items-center justify-end gap-1`}>
                        <Award size={14} />
                        {item.growth >= 0 ? '+' : ''}{item.growth.toFixed(2)}%
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

function HighlightCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
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
