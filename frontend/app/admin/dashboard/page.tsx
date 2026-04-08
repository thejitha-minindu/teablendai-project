"use client";

import { useState, useEffect } from "react";
import { Bell, Database, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {

  const [totalAuctions, setTotalAuctions] = useState(0);
  const [totalSellers, setTotalSellers] = useState(0);
  const [totalBuyers, setTotalBuyers] = useState(0);
  const [pendingSellers, setPendingSellers] = useState(0);
  const [pendingBuyers, setPendingBuyers] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/admin/dashboard-stats");
        const data = await res.json();

        setTotalAuctions(data.total_auctions || 0);
        setTotalSellers(data.total_sellers || 0);
        setTotalBuyers(data.total_buyers || 0);
        setPendingSellers(data.pending_sellers || 0);
        setPendingBuyers(data.pending_buyers || 0);

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-2 space-y-4">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">System overview & controls</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Buyers" value={String(totalBuyers)} sub={String(pendingBuyers)} />
        <StatCard title="Total Sellers" value={String(totalSellers)} sub={String(pendingSellers)} />
        <StatCard title="Total Auctions" value={String(totalAuctions)} sub="Live 0" />
        <ViolationCard />
      </div>

      {/* ANALYTICS + ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold mb-2">System Activity</h2>
          <p className="text-sm text-gray-500 mb-4">
            Monthly system activity overview
          </p>

          <div className="h-52 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            📊 Analytics Chart Here
          </div>
        </div>

        <Link
          href="/admin/sendnotification"
          className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-lg transition"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-green-700" />
            <h2 className="text-lg font-semibold">Notify Users</h2>
          </div>

          <button className="mt-6 bg-green-800 text-white py-2 rounded-lg font-medium hover:bg-green-900">
            Send Notification
          </button>
        </Link>

      </div>

      <div className="flex justify-center pt-6">
        <Link
          href="/admin/insertdata"
          className="flex items-center gap-3 bg-white px-8 py-4 rounded-full shadow hover:shadow-lg transition border-3 border-green-700 animate-borderFade">
          <Database className="w-6 h-6 text-green-700" />
          <span className="font-semibold text-gray-700">
            Insert Data to Database
          </span>
        </Link>
      </div>

      <style jsx global>{`
  @keyframes borderFade {
    50%, 50% { border-color: rgba(34, 197, 94, 1); }   /* solid green */
    50% { border-color: rgba(34, 197, 94, 0); }       /* transparent */
  }

  .animate-borderFade {
    animation: borderFade 3s infinite;
  }
`}</style>

    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-10">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-4xl font-bold my-3">{value}</p>
      <span className="inline-block text-sm bg-green-800 text-white px-3 py-1 rounded-full">
        {sub}
      </span>
    </div>
  );
}

function ViolationCard() {
  return (
    <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-red-600" />
        <h3 className="text-sm text-gray-500">Total Violations</h3>
      </div>

      <p className="text-4xl font-bold my-3">99</p>

      <Link href="/admin/violationhandling">
        <button className="w-full bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition">
          Take Action
        </button>
      </Link>
    </div>
  );
}