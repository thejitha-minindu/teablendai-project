"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { HistoryCard } from "@/components/admincomponents/HistoryCard";
import { 
  Search, 
  Filter, 
  Bell, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Download,
  X
} from "lucide-react";

export default function NotificationHistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [rawNotifications, setRawNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 5;



    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await apiClient.get("/notifications/history");
                setRawNotifications(res.data || []);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Format the backend data to match what the UI expects
    const notifications = rawNotifications.map((n, i) => {
        const d = new Date(n.created_at);
        return {
            notifyId: `NOT-${d.getTime().toString().slice(-6)}-${i}`,
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().split(' ')[0].slice(0, 5),
            title: n.title,
            type: n.type.charAt(0).toUpperCase() + n.type.slice(1),
            revisers: `${n.recipient_count} Recipients`,
            content: n.message,
            status: "sent"
        };
    });

    // Get unique notification types for filter
    const uniqueTypes = Array.from(new Set(notifications.map(n => n.type)));

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             notification.notifyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             notification.revisers.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || notification.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Pagination
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm !== "" || typeFilter !== "all";

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="w-7 h-7 text-green-700" />
                    Notification History
                </h1>
                <p className="text-gray-500 mt-1">View and manage all sent notifications</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500">Total Sent</p>
                    <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <p className="text-xs text-gray-500">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">
                        {notifications.filter(n => n.status === "sent").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {notifications.filter(n => n.status === "pending").length}
                    </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                    <p className="text-xs text-gray-500">Unique Types</p>
                    <p className="text-2xl font-bold text-purple-600">{uniqueTypes.length}</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, ID, or revisers..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="all">All Types</option>
                        {uniqueTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                    Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
                </p>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                    <Download className="w-4 h-4" />
                    Export History
                </button>
            </div>

            {/* Notification List */}
            {paginatedNotifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications found</h3>
                    <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedNotifications.map((notification, index) => (
                        <HistoryCard
                            key={index}
                            notifyId={notification.notifyId}
                            date={notification.date}
                            time={notification.time}
                            title={notification.title}
                            type={notification.type}
                            revisers={notification.revisers}
                            content={notification.content}
                            status={notification.status}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded-lg transition-all ${
                                    currentPage === page
                                        ? "bg-green-600 text-white"
                                        : "border border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}