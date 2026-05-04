"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Database, 
  AlertTriangle, 
  ShoppingBag, 
  Store, 
  Gavel, 
  TrendingUp, 
  BarChart3,
  Users,
  Send,
  PlusCircle
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {

  const [totalAuctions, setTotalAuctions] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [pendingSellers, setPendingSellers] = useState(0);
  const [pendingBuyers, setPendingBuyers] = useState(0);
  const [totalViolations, setTotalViolations] = useState(0);
  const [liveAuctions, setLiveAuctions] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { apiClient } = await import("@/lib/apiClient");
        const res = await apiClient.get("/admin/dashboard-stats");
        const data = res.data;

        console.log("[Admin Dashboard] dashboard-stats response:", data);

        setTotalAuctions(data.total_auctions || 0);
        setTotalSellers(data.total_sellers || 0);
        setTotalBuyers(data.total_buyers || 0);
        setPendingSellers(data.pending_sellers || 0);
        setPendingBuyers(data.pending_buyers || 0);
        setTotalViolations(data.total_violations || 0);
        setLiveAuctions(data.live_auctions || 0);

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-green-700" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">System overview & controls</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Buyers" 
          value={String(totalBuyers)} 
          sub={`Pending: ${pendingBuyers}`}
          icon={<ShoppingBag className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard 
          title="Total Sellers" 
          value={String(totalSellers)} 
          sub={`Pending: ${pendingSellers}`}
          icon={<Store className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard 
          title="Total Auctions" 
          value={String(totalAuctions)} 
          sub={`Live: ${liveAuctions}`}
          icon={<Gavel className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <ViolationCard totalViolations={totalViolations} />
      </div>

      {/* ANALYTICS + ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-green-700" />
            <h2 className="font-semibold text-gray-800">System Activity</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Monthly system activity overview
          </p>

          <div className="h-52 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 border-2 border-dashed border-gray-200">
            <BarChart3 className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Analytics Chart Coming Soon</p>
          </div>
        </div>

        <Link
          href="/admin/sendnotification"
          className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
              <Bell className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Notify Users</h2>
              <p className="text-xs text-gray-500">Send broadcast notifications</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between bg-green-50 p-3 rounded-lg group-hover:bg-green-100 transition-colors">
            <span className="text-sm text-green-700 font-medium">Send Notification</span>
            <Send className="w-4 h-4 text-green-700" />
          </div>
        </Link>

      </div>

      {/* INSERT DATA BUTTON */}
      <div className="flex justify-center pt-4">
        <Link
          href="/admin/insertdata"
          className="flex items-center gap-3 bg-white px-8 py-4 rounded-full shadow-md hover:shadow-xl transition-all duration-300 border-2 border-green-600 hover:bg-green-50 group"
        >
          <div className="p-1 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
            <PlusCircle className="w-5 h-5 text-green-700" />
          </div>
          <span className="font-semibold text-gray-700 group-hover:text-green-700 transition-colors">
            Insert Data to Database
          </span>
          <Database className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

    </div>
  );
}

/* ---------------- STAT CARD COMPONENT ---------------- */

function StatCard({
  title,
  value,
  sub,
  icon,
  iconBg,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-full ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-3">{value}</p>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-600"></div>
        <span className="text-xs font-medium text-gray-600">{sub}</span>
      </div>
    </div>
  );
}

/* ---------------- VIOLATION CARD COMPONENT ---------------- */

function ViolationCard({ totalViolations }: { totalViolations: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Violations</h3>
        </div>
        {totalViolations > 0 && (
          <div className="px-2 py-1 bg-red-100 rounded-full animate-pulse">
            <span className="text-xs font-bold text-red-600">URGENT</span>
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-gray-800 mb-4">
        {String(totalViolations)}
      </p>

      <Link href="/admin/violationhandling">
        <button className="w-full bg-gradient-to-r from-red-50 to-red-100 text-red-700 py-2.5 rounded-lg font-medium hover:from-red-100 hover:to-red-200 transition-all duration-200 flex items-center justify-center gap-2 group">
          <AlertTriangle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Take Action
        </button>
      </Link>
    </div>
  );
}