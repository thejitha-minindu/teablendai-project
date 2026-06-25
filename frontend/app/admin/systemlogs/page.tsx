"use client";

import { useSystemLogs } from "@/hooks/use-system-logs";
import SystemLogCard from "@/components/admincomponents/SystemLogCard";
import {
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  RefreshCw,
  Clock,
  Users,
  TrendingUp,
  FileText,
  AlertTriangle
} from "lucide-react";

export default function SystemActivityPage() {
  const {
    logs,
    total,
    isLoading,
    isLive,
    filters,
    setFilter,
    resetFilters,
    toggleLive,
    refresh
  } = useSystemLogs(10); // default to 10 logs per page

  // Calculate statistics from the local logs cache (or simple summary info)
  const stats = {
    total: total,
    login: logs.filter(a => a.activityType === "Login").length,
    bids: logs.filter(a => a.activityType === "Bid Placed").length,
    violations: logs.filter(a => a.activityType.toLowerCase().includes("violation")).length
  };

  const hasActiveFilters =
    (filters.status !== "") ||
    (filters.activity_type !== "") ||
    (filters.date_from !== "") ||
    (filters.date_to !== "") ||
    (filters.search !== "");

  const handlePageChange = (newPage: number) => {
    setFilter("page", newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const totalPages = Math.ceil(total / limit);

  const activityTypes = [
    "Login",
    "Logout",
    "Document Upload",
    "Bid Placed",
    "Auction Viewed",
    "User Verified",
    "User Deleted",
    "Profile Updated",
    "System Settings Changed",
    "Payment Processed",
    "Product Listed",
    "Auction Created",
    "Auction Cancelled",
    "Violation Flagged",
    "Violation Resolved",
    "Password Reset"
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-600" />
            System Activity Logs
          </h1>
          <p className="text-gray-500 mt-1">Monitor and audit system operations in real-time</p>
        </div>

        {/* Live Stream Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-sm border transition-all duration-300 ${
              isLive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <Pause className="w-4 h-4" />
                Live Mode (SSE)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                Resume Live Stream
              </>
            )}
          </button>

          {!isLive && (
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-600 disabled:opacity-50 transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Live Warning Alert */}
      {isLive && (
        <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>Real-time mode is <strong>active</strong>. New actions are appended automatically. Pause Live mode to enable filters and history pagination.</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-405 uppercase tracking-wider">Total Recorded</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
          </div>
          <Activity className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-405 uppercase tracking-wider">Logins (Cached)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.login}</p>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-405 uppercase tracking-wider">Bids (Cached)</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.bids}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-405 uppercase tracking-wider">violations (Cached)</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.violations}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 transition-opacity duration-300 ${isLive ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, detail, etc..."
              disabled={isLive}
              value={filters.search || ""}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Activity Type */}
          <select
            disabled={isLive}
            value={filters.activity_type || ""}
            onChange={(e) => setFilter("activity_type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            <option value="">All Activities</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status */}
          <select
            disabled={isLive}
            value={filters.status || ""}
            onChange={(e) => setFilter("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            disabled={isLive}
            value={filters.date_from || ""}
            onChange={(e) => setFilter("date_from", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
          />

          {/* Date To */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              disabled={isLive}
              value={filters.date_to || ""}
              onChange={(e) => setFilter("date_to", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            />
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                disabled={isLive}
                className="flex items-center justify-center p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                title="Clear filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Title */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {isLive ? "Live Activity Stream (Max 100)" : `Showing Page ${page} of ${totalPages || 1}`}
        </p>
      </div>

      {/* List / Loader */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-gray-400 mt-4 font-medium">Loading system logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center shadow-sm">
          <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">No activities found</h3>
          <p className="text-gray-450">There are no records matching your current filter settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <SystemLogCard key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Pagination (Only visible when not in live mode) */}
      {!isLive && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold text-sm ${
                  page === p
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-gray-200 hover:bg-gray-100 bg-white text-gray-700 shadow-sm"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}