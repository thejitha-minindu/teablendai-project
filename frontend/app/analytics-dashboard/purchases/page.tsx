"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useAnalyticsPurchases } from "@/hooks/use-analytics-purchases";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function PurchaseAnalytics() {
  const { data, loading, error, isStale, lastUpdated } = useAnalyticsPurchases();

  if (loading && !data) {
    return <div className="p-6 text-gray-500">Loading purchase analytics...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">Failed to load purchase analytics: {error ?? "Unknown error"}</div>;
  }

  const summary = data.summary;
  const purchaseVolumeByGrade = data.purchaseVolumeByGrade;
  const brokerVsFactory = data.sourceDistribution;
  const supplierContribution = data.supplierContribution;
  const priceTrendGrades = data.priceTrendGrades;
  const priceTrends = data.priceTrends.map((item) => ({
    month: item.month,
    ...item.prices,
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Analytics</h1>
          <p className="text-gray-600 mt-1">Track tea procurement and cost analysis</p>
        </div>
        <div className="text-xs text-right text-gray-500">
          <p>Last update: {new Date(lastUpdated ?? data.generatedAt).toLocaleTimeString()}</p>
          {isStale ? <p className="text-amber-600">Showing last successful snapshot</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Purchased"
          value={`${summary.totalPurchasedKg.toLocaleString()} kg`}
          subtitle="Across all grades"
        />
        <SummaryCard
          title="Total Cost"
          value={`${(summary.totalCostLkr / 1000000).toFixed(2)}M LKR`}
          subtitle={`Average: ${summary.averagePriceLkrPerKg.toLocaleString()} LKR/kg`}
        />
        <SummaryCard
          title="Unique Suppliers"
          value={summary.uniqueSuppliers.toLocaleString()}
          subtitle={`${summary.newSuppliersThisMonth} new this month`}
        />
        <SummaryCard
          title="Purchase Orders"
          value={summary.purchaseOrders.toLocaleString()}
          subtitle={`${summary.pendingOrders} pending`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <ChartCard title="Purchase Price Trends by Grade">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {priceTrendGrades.map((grade, index) => (
                <Line
                  key={grade}
                  type="monotone"
                  dataKey={grade}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={grade}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Purchase Source Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={brokerVsFactory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, percentage }) => `${String(source)}: ${Number(percentage).toFixed(1)}%`}
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
                    <td className="text-right py-3 px-2">
                      {item.quantity > 0 ? (item.cost / item.quantity).toFixed(0) : "0"} LKR/kg
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
