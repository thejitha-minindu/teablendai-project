"use client";

import { useState, useEffect } from "react";
import { Bell, Database, AlertTriangle, Users, CheckCircle, XCircle, Loader } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";

export default function AdminDashboard() {

  const [totalAuctions, setTotalAuctions] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/admin/dashboard-stats");
        const data = await res.json();
        setTotalAuctions(data.total_auctions);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiClient.get("/admin/users?status=PENDING");
      setPendingUsers(response.data);
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/approve`);
      setPendingUsers(pendingUsers.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/reject`);
      setPendingUsers(pendingUsers.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  return (
    <div className="p-2 space-y-4">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">System overview & controls</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Buyers" value="234" sub="Pending 27" />
        <StatCard title="Total Sellers" value="156" sub="Pending 12" />
        <StatCard title="Total Auctions" value={String(totalAuctions)} sub="Pending 0" />
        <ViolationCard />
      </div>

      {/* USER APPROVAL SECTION */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold">Pending User Approvals</h2>
          </div>
          <button 
            onClick={fetchPendingUsers}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {loadingUsers ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No pending user approvals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500">@{user.user_name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                        {user.default_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => approveUser(user.user_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(user.user_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-xs font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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