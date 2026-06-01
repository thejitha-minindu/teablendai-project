"use client";

import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Package, Award, Activity
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useAnalyticsOverview } from "@/hooks/use-analytics-overview";

type Trending = 'up' | 'down' | 'neutral';

export default function AnalyticsOverview() {
  const { data, loading, error, isStale, lastUpdated } = useAnalyticsOverview();

  if (loading && !data) {
    return <div className="p-6 text-gray-500">Loading analytics dashboard...</div>;
  }

  if (!data) {
    return <div className="p-6 text-red-600">Failed to load dashboard: {error ?? "Unknown error"}</div>;
  }

  const kpiData = data.kpis;
  const revenueByMonth = data.revenueByMonth;
  const teaGradeDistribution = data.teaGradeDistribution;
  const topBlends = data.topBlends;
  const quickStats = data.quickStats;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tea Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your tea business</p>
        </div>
        <div className="text-xs text-right text-gray-500">
          <p>Last update: {new Date(lastUpdated ?? data.generatedAt).toLocaleTimeString()}</p>
          {isStale ? <p className="text-amber-600">Showing last successful snapshot</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard title="Total Tea Auction Volume (Participated)" value={kpiData.totalPurchased.value.toLocaleString()} unit="kg" trend={kpiData.totalPurchased.trend} trending={kpiData.totalPurchased.trending} icon={<ShoppingCart className="text-blue-600" />} color="blue" />
        <KPICard title="Total Tea Sold Volume" value={kpiData.totalSold.value.toLocaleString()} unit="kg" trend={kpiData.totalSold.trend} trending={kpiData.totalSold.trending} icon={<Package className="text-green-600" />} color="green" />
        <KPICard title="Total Revenue" value={`${(kpiData.totalRevenue.value / 1000000)}M`} unit="LKR" trend={kpiData.totalRevenue.trend} trending={kpiData.totalRevenue.trending} icon={<DollarSign className="text-purple-600" />} color="purple" />
        <KPICard title="Avg Auction Price" value={kpiData.avgAuctionPrice.value.toLocaleString()} unit="LKR/kg" trend={kpiData.avgAuctionPrice.trend} trending={kpiData.avgAuctionPrice.trending} icon={<Award className="text-orange-600" />} color="orange" />
        <KPICard title="Profit Margin" value={kpiData.profitMargin.value.toFixed(2)} unit="%" trend={kpiData.profitMargin.trend} trending={kpiData.profitMargin.trending} icon={<TrendingUp className="text-indigo-600" />} color="indigo" />
        <KPICard title="Active Auctions" value={kpiData.activeAuctions.value.toString()} unit="auctions" trend={kpiData.activeAuctions.trend} trending={kpiData.activeAuctions.trending} icon={<Activity className="text-pink-600" />} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue & Purchase Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="Revenue (LKR)" />
              <Line yAxisId="right" type="monotone" dataKey="purchases" stroke="#82ca9d" strokeWidth={2} name="Purchases (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tea Grade Distribution(Live + Scheduled)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={teaGradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${Number(value).toFixed(1)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {teaGradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Performing Blends">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBlends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#0088FE" name="Sales (kg)" />
              <Bar dataKey="profit" fill="#00C49F" name="Profit (%)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <StatRow label="Total Customers" value={quickStats.totalCustomers.toLocaleString()} />
            <StatRow label="Active Buyers" value={quickStats.activeBuyers.toLocaleString()} />
            <StatRow label="Completed Auctions (This Month)" value={quickStats.completedAuctionsThisMonth.toLocaleString()} />
            <StatRow label="Average Blend Margin" value={`${quickStats.averageBlendMargin.toFixed(1)}%`} />
            <StatRow label="Inventory Stock" value={`${quickStats.inventoryStockKg.toLocaleString()} kg`} />
            <StatRow label="Pending Orders" value={quickStats.pendingOrders.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  unit: string;
  trend: number;
  trending: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function KPICard({ title, value, unit, trend, trending, icon, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    indigo: 'bg-indigo-50',
    pink: 'bg-pink-50',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        {trending !== 'neutral' && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trending === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trending === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-gray-500 text-sm">{unit}</span>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}
