"use client";

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { Filter, Download } from 'lucide-react';

// Dummy Data
const purchaseVolumeByGrade = [
  { grade: 'BOP', quantity: 15800, cost: 18960000 },
  { grade: 'BOPF', quantity: 12600, cost: 13860000 },
  { grade: 'Dust', quantity: 9200, cost: 8280000 },
  { grade: 'OP', quantity: 5400, cost: 7560000 },
  { grade: 'Pekoe', quantity: 2780, cost: 3892000 },
];

const priceTrends = [
  { month: 'Jan', BOP: 1200, BOPF: 1100, Dust: 900, OP: 1400 },
  { month: 'Feb', BOP: 1220, BOPF: 1120, Dust: 920, OP: 1420 },
  { month: 'Mar', BOP: 1180, BOPF: 1080, Dust: 880, OP: 1380 },
  { month: 'Apr', BOP: 1250, BOPF: 1150, Dust: 950, OP: 1450 },
  { month: 'May', BOP: 1280, BOPF: 1180, Dust: 980, OP: 1480 },
  { month: 'Jun', BOP: 1260, BOPF: 1160, Dust: 960, OP: 1460 },
];

const brokerVsFactory = [
  { source: 'Brokers', quantity: 28500, percentage: 62 },
  { source: 'Factories', quantity: 17280, percentage: 38 },
];

const supplierContribution = [
  { supplier: 'Ceylon Tea Brokers', quantity: 12400, cost: 15500000 },
  { supplier: 'Nuwara Eliya Estates', quantity: 10200, cost: 14280000 },
  { supplier: 'Dimbula Tea Co.', quantity: 8900, cost: 11165000 },
  { supplier: 'Uva Highlands', quantity: 7650, cost: 10710000 },
  { supplier: 'Kandy Premium', quantity: 6630, cost: 9282000 },
];

const purchaseQuantityCost = [
  { month: 'Jan', quantity: 7200, cost: 8640000 },
  { month: 'Feb', quantity: 7500, cost: 9000000 },
  { month: 'Mar', quantity: 7800, cost: 9360000 },
  { month: 'Apr', quantity: 8100, cost: 9720000 },
  { month: 'May', quantity: 8400, cost: 10080000 },
  { month: 'Jun', quantity: 7780, cost: 9336000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PurchaseAnalytics() {
  const [timeFilter, setTimeFilter] = useState('6months');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Analytics</h1>
          <p className="text-gray-600 mt-1">Track tea procurement and cost analysis</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard title="Total Purchased" value="45,780 kg" subtitle="Across all grades" />
        <SummaryCard title="Total Cost" value="61.0M LKR" subtitle="Average: 1,332 LKR/kg" />
        <SummaryCard title="Unique Suppliers" value="23" subtitle="5 new this month" />
        <SummaryCard title="Purchase Orders" value="147" subtitle="12 pending" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Volume by Grade */}
        <ChartCard title="Purchase Volume by Tea Grade">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={purchaseVolumeByGrade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="quantity" fill="#0088FE" name="Quantity (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Price Trends */}
        <ChartCard title="Purchase Price Trends by Grade">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="BOP" stroke="#0088FE" strokeWidth={2} />
              <Line type="monotone" dataKey="BOPF" stroke="#00C49F" strokeWidth={2} />
              <Line type="monotone" dataKey="Dust" stroke="#FFBB28" strokeWidth={2} />
              <Line type="monotone" dataKey="OP" stroke="#FF8042" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Broker vs Factory */}
        <ChartCard title="Purchase Source Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={brokerVsFactory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, percentage }) => `${source}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="percentage"
              >
                {brokerVsFactory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {brokerVsFactory.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-600">{item.source}</span>
                <span className="font-semibold">{item.quantity.toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Supplier Contribution */}
        <ChartCard title="Top Suppliers by Volume">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={supplierContribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="supplier" type="category" width={150} fontSize={12} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#00C49F" name="Quantity (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost Breakdown Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown by Grade</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-600 font-medium">Grade</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Quantity</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Total Cost</th>
                  <th className="text-right py-3 px-2 text-gray-600 font-medium">Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {purchaseVolumeByGrade.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{item.grade}</td>
                    <td className="text-right py-3 px-2">{item.quantity.toLocaleString()} kg</td>
                    <td className="text-right py-3 px-2">{(item.cost / 1000000).toFixed(2)}M LKR</td>
                    <td className="text-right py-3 px-2">{(item.cost / item.quantity).toFixed(0)} LKR/kg</td>
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

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
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
