"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Award } from 'lucide-react';

// Dummy Data
const blendComposition = [
  { blend: 'Premium Gold', BOP: 45, BOPF: 30, Dust: 15, OP: 10 },
  { blend: 'Classic Blend', BOP: 40, BOPF: 35, Dust: 20, OP: 5 },
  { blend: 'Morning Fresh', BOP: 50, BOPF: 25, Dust: 15, OP: 10 },
  { blend: 'Afternoon Delight', BOP: 35, BOPF: 30, Dust: 25, OP: 10 },
  { blend: 'Royal Reserve', BOP: 30, BOPF: 20, Dust: 10, OP: 40 },
];

const blendProfitability = [
  { blend: 'Premium Gold', cost: 1180, sellPrice: 1520, margin: 28.8, revenue: 18.5 },
  { blend: 'Classic Blend', cost: 1050, sellPrice: 1320, margin: 25.7, revenue: 22.3 },
  { blend: 'Morning Fresh', cost: 1220, sellPrice: 1580, margin: 29.5, revenue: 16.8 },
  { blend: 'Afternoon Delight', cost: 980, sellPrice: 1250, margin: 27.6, revenue: 14.2 },
  { blend: 'Royal Reserve', cost: 1420, sellPrice: 1850, margin: 30.3, revenue: 12.6 },
];

const monthlyBlendPerformance = [
  { month: 'Jan', premiumGold: 2.8, classicBlend: 3.5, morningFresh: 2.4, afternoonDelight: 2.1, royalReserve: 1.9 },
  { month: 'Feb', premiumGold: 3.1, classicBlend: 3.8, morningFresh: 2.6, afternoonDelight: 2.3, royalReserve: 2.1 },
  { month: 'Mar', premiumGold: 3.3, classicBlend: 4.1, morningFresh: 2.8, afternoonDelight: 2.5, royalReserve: 2.3 },
  { month: 'Apr', premiumGold: 3.0, classicBlend: 3.9, morningFresh: 2.7, afternoonDelight: 2.4, royalReserve: 2.2 },
  { month: 'May', premiumGold: 3.2, classicBlend: 4.2, morningFresh: 2.9, afternoonDelight: 2.6, royalReserve: 2.4 },
  { month: 'Jun', premiumGold: 3.1, classicBlend: 4.0, morningFresh: 2.8, afternoonDelight: 2.3, royalReserve: 2.3 },
];

const blendMarketShare = [
  { blend: 'Classic Blend', share: 28.5, value: 22.3 },
  { blend: 'Premium Gold', share: 23.6, value: 18.5 },
  { blend: 'Morning Fresh', share: 21.4, value: 16.8 },
  { blend: 'Afternoon Delight', share: 18.1, value: 14.2 },
  { blend: 'Royal Reserve', share: 8.4, value: 12.6 },
];

const profitMarginTrend = [
  { month: 'Jan', premiumGold: 27.2, classicBlend: 24.5, morningFresh: 28.1, royalReserve: 29.5 },
  { month: 'Feb', premiumGold: 27.8, classicBlend: 25.1, morningFresh: 28.6, royalReserve: 29.8 },
  { month: 'Mar', premiumGold: 28.3, classicBlend: 25.4, morningFresh: 29.1, royalReserve: 30.1 },
  { month: 'Apr', premiumGold: 28.5, classicBlend: 25.6, morningFresh: 29.3, royalReserve: 30.2 },
  { month: 'May', premiumGold: 28.7, classicBlend: 25.7, morningFresh: 29.4, royalReserve: 30.3 },
  { month: 'Jun', premiumGold: 28.8, classicBlend: 25.7, morningFresh: 29.5, royalReserve: 30.3 },
];

const annualComparison = [
  { blend: 'Premium Gold', year2023: 15.2, year2024: 18.5, growth: 21.7 },
  { blend: 'Classic Blend', year2023: 19.8, year2024: 22.3, growth: 12.6 },
  { blend: 'Morning Fresh', year2023: 14.1, year2024: 16.8, growth: 19.1 },
  { blend: 'Afternoon Delight', year2023: 12.6, year2024: 14.2, growth: 12.7 },
  { blend: 'Royal Reserve', year2023: 11.2, year2024: 12.6, growth: 12.5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function BlendPerformanceAnalytics() {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blend Performance & Profitability</h1>
          <p className="text-gray-600 mt-1">Analyze blend composition and financial metrics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <HighlightCard title="Total Blends" value="5" subtitle="Active products" />
        <HighlightCard title="Avg Profit Margin" value="28.4%" subtitle="Across all blends" />
        <HighlightCard title="Best Performer" value="Royal Reserve" subtitle="30.3% margin" />
        <HighlightCard title="Total Blend Revenue" value="84.4M LKR" subtitle="Last 6 months" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blend Composition */}
        <ChartCard title="Blend Composition by Tea Grade">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={blendComposition}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="blend" fontSize={11} />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="BOP" stackId="a" fill="#0088FE" />
              <Bar dataKey="BOPF" stackId="a" fill="#00C49F" />
              <Bar dataKey="Dust" stackId="a" fill="#FFBB28" />
              <Bar dataKey="OP" stackId="a" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Profit Margins */}
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

        {/* Monthly Performance */}
        <ChartCard title="Monthly Revenue by Blend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyBlendPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Revenue (M LKR)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="premiumGold" stroke="#0088FE" strokeWidth={2} name="Premium Gold" />
              <Line type="monotone" dataKey="classicBlend" stroke="#00C49F" strokeWidth={2} name="Classic Blend" />
              <Line type="monotone" dataKey="morningFresh" stroke="#FFBB28" strokeWidth={2} name="Morning Fresh" />
              <Line type="monotone" dataKey="afternoonDelight" stroke="#FF8042" strokeWidth={2} name="Afternoon Delight" />
              <Line type="monotone" dataKey="royalReserve" stroke="#8884d8" strokeWidth={2} name="Royal Reserve" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Market Share */}
        <ChartCard title="Market Share by Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={blendMarketShare}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ blend, share }) => `${blend}: ${share}%`}
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

        {/* Profit Margin Trends */}
        <ChartCard title="Profit Margin Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitMarginTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="premiumGold" stroke="#0088FE" strokeWidth={2} name="Premium Gold" />
              <Line type="monotone" dataKey="classicBlend" stroke="#00C49F" strokeWidth={2} name="Classic Blend" />
              <Line type="monotone" dataKey="morningFresh" stroke="#FFBB28" strokeWidth={2} name="Morning Fresh" />
              <Line type="monotone" dataKey="royalReserve" stroke="#8884d8" strokeWidth={2} name="Royal Reserve" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Annual Comparison */}
        <ChartCard title="Year-over-Year Revenue Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={annualComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="blend" fontSize={11} />
              <YAxis label={{ value: 'Revenue (M LKR)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="year2023" fill="#94a3b8" name="2023" />
              <Bar dataKey="year2024" fill="#0088FE" name="2024" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Table */}
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
                    <td className="text-right py-3 px-2">{item.cost} LKR</td>
                    <td className="text-right py-3 px-2">{item.sellPrice} LKR</td>
                    <td className="text-right py-3 px-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {item.margin}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">{item.revenue}M LKR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Growth Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Blend</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">2023</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">2024</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody>
                {annualComparison.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.blend}</td>
                    <td className="text-right py-3 px-2">{item.year2023}M</td>
                    <td className="text-right py-3 px-2 font-semibold">{item.year2024}M</td>
                    <td className="text-right py-3 px-2">
                      <span className="text-green-600 font-medium flex items-center justify-end gap-1">
                        <Award size={14} />
                        +{item.growth}%
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
