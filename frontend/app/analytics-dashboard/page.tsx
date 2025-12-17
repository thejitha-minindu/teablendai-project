"use client";

import { 
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, 
<<<<<<< Updated upstream
  Package, Activity, Award 
=======
  Package, Users, Award, Activity 
>>>>>>> Stashed changes
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Dummy Data
const kpiData = {
<<<<<<< Updated upstream
  totalPurchased: { value: 45780, unit: 'kg', trend: 12.5, trending: 'up' as const },
  totalSold: { value: 42350, unit: 'kg', trend: 8.3, trending: 'up' as const },
  totalRevenue: { value: 2847500, unit: 'LKR', trend: 15.2, trending: 'up' as const },
  avgAuctionPrice: { value: 1250, unit: 'LKR/kg', trend: -3.1, trending: 'down' as const },
  profitMargin: { value: 22.5, unit: '%', trend: 4.2, trending: 'up' as const },
  activeAuctions: { value: 8, unit: '', trend: 0, trending: 'neutral' as const },
=======
  totalPurchased: { value: 45780, unit: 'kg', trend: 12.5, trending: 'up' },
  totalSold: { value: 42350, unit: 'kg', trend: 8.3, trending: 'up' },
  totalRevenue: { value: 2847500, unit: 'LKR', trend: 15.2, trending: 'up' },
  avgAuctionPrice: { value: 1250, unit: 'LKR/kg', trend: -3.1, trending: 'down' },
  profitMargin: { value: 22.5, unit: '%', trend: 4.2, trending: 'up' },
  activeAuctions: { value: 8, unit: '', trend: 0, trending: 'neutral' },
>>>>>>> Stashed changes
};

const revenueByMonth = [
  { month: 'Jan', revenue: 185000, purchases: 3200 },
  { month: 'Feb', revenue: 195000, purchases: 3400 },
  { month: 'Mar', revenue: 210000, purchases: 3650 },
  { month: 'Apr', revenue: 225000, purchases: 3800 },
  { month: 'May', revenue: 242000, purchases: 4100 },
  { month: 'Jun', revenue: 238000, purchases: 3950 },
];

const teaGradeDistribution = [
  { name: 'BOP', value: 35, color: '#0088FE' },
  { name: 'BOPF', value: 28, color: '#00C49F' },
  { name: 'Dust', value: 20, color: '#FFBB28' },
  { name: 'OP', value: 12, color: '#FF8042' },
  { name: 'Others', value: 5, color: '#8884d8' },
];

const topBlends = [
  { name: 'Premium Ceylon', sales: 8500, profit: 22 },
  { name: 'Gold Blend', sales: 7200, profit: 19 },
  { name: 'Morning Fresh', sales: 6800, profit: 24 },
  { name: 'Classic Mix', sales: 6200, profit: 18 },
  { name: 'Estate Select', sales: 5900, profit: 21 },
];

export default function AnalyticsOverview() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tea Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive insights into your tea business</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Total Tea Purchased"
          value={kpiData.totalPurchased.value.toLocaleString()}
          unit={kpiData.totalPurchased.unit}
          trend={kpiData.totalPurchased.trend}
          trending={kpiData.totalPurchased.trending}
          icon={<ShoppingCart className="text-blue-600" />}
          color="blue"
        />
        <KPICard
          title="Total Tea Sold"
          value={kpiData.totalSold.value.toLocaleString()}
          unit={kpiData.totalSold.unit}
          trend={kpiData.totalSold.trend}
          trending={kpiData.totalSold.trending}
          icon={<Package className="text-green-600" />}
          color="green"
        />
        <KPICard
          title="Total Revenue"
          value={`${(kpiData.totalRevenue.value / 1000000).toFixed(2)}M`}
          unit={kpiData.totalRevenue.unit}
          trend={kpiData.totalRevenue.trend}
          trending={kpiData.totalRevenue.trending}
          icon={<DollarSign className="text-purple-600" />}
          color="purple"
        />
        <KPICard
          title="Avg Auction Price"
          value={kpiData.avgAuctionPrice.value.toLocaleString()}
          unit={kpiData.avgAuctionPrice.unit}
          trend={kpiData.avgAuctionPrice.trend}
          trending={kpiData.avgAuctionPrice.trending}
          icon={<Award className="text-orange-600" />}
          color="orange"
        />
        <KPICard
          title="Profit Margin"
          value={kpiData.profitMargin.value.toString()}
          unit={kpiData.profitMargin.unit}
          trend={kpiData.profitMargin.trend}
          trending={kpiData.profitMargin.trending}
          icon={<TrendingUp className="text-indigo-600" />}
          color="indigo"
        />
        <KPICard
          title="Active Auctions"
          value={kpiData.activeAuctions.value.toString()}
          unit="auctions"
          trend={kpiData.activeAuctions.trend}
          trending="neutral"
          icon={<Activity className="text-pink-600" />}
          color="pink"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
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

        {/* Tea Grade Distribution */}
        <ChartCard title="Tea Grade Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={teaGradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
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

        {/* Top Blends Performance */}
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

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <StatRow label="Total Customers" value="247" />
            <StatRow label="Active Buyers" value="89" />
            <StatRow label="Completed Auctions (This Month)" value="34" />
            <StatRow label="Average Blend Margin" value="21.3%" />
            <StatRow label="Inventory Stock" value="3,430 kg" />
            <StatRow label="Pending Orders" value="12" />
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
<<<<<<< Updated upstream
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    indigo: 'bg-indigo-50',
    pink: 'bg-pink-50',
=======
    blue: 'bg-blue-200',
    green: 'bg-green-200',
    purple: 'bg-purple-200',
    orange: 'bg-orange-200',
    indigo: 'bg-indigo-200',
    pink: 'bg-pink-200',
>>>>>>> Stashed changes
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
