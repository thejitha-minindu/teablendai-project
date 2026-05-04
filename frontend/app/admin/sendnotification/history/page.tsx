"use client";

import { useState } from "react";
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
    const itemsPerPage = 5;

    const notifications = [
        {
            notifyId: "NOT001NF",
            date: "2023-10-15",
            time: "14:30",
            title: "Auction Registration Reminder",
            type: "Reminder",
            revisers: "All Users",
            content: "Don't forget to register for upcoming auctions",
            status: "sent"
        },
        {
            notifyId: "NOT002NF",
            date: "2023-10-16",
            time: "09:15",
            title: "Bid Submission Deadline",
            type: "Alert",
            revisers: "Registered Bidders",
            content: "Bid submission deadline is approaching",
            status: "sent"
        },
        {
            notifyId: "NOT003NF",
            date: "2023-10-17",
            time: "16:45",
            title: "Auction Results Announcement",
            type: "Announcement",
            revisers: "All Participants",
            content: "Auction results have been published",
            status: "sent"
        },
        {
            notifyId: "NOT004NF",
            date: "2023-10-18",
            time: "11:20",
            title: "Payment Due Reminder",
            type: "Reminder",
            revisers: "Winning Bidders",
            content: "Payment is due within 7 days",
            status: "sent"
        },
        {
            notifyId: "NOT005NF",
            date: "2023-10-19",
            time: "13:00",
            title: "System Maintenance Notification",
            type: "Maintenance",
            revisers: "All Users",
            content: "System will be down for maintenance",
            status: "sent"
        },
        {
            notifyId: "NOT006NF",
            date: "2023-10-20",
            time: "15:30",
            title: "New Auction Listing",
            type: "Update",
            revisers: "Subscribed Users",
            content: "New auctions are now available",
            status: "sent"
        },
        {
            notifyId: "NOT007NF",
            date: "2023-10-21",
            time: "10:00",
            title: "Document Verification Required",
            type: "Action Required",
            revisers: "Pending Verification",
            content: "Please verify your documents",
            status: "pending"
        },
        {
            notifyId: "NOT008NF",
            date: "2023-10-22",
            time: "17:45",
            title: "Auction Extended Notice",
            type: "Update",
            revisers: "Active Bidders",
            content: "Auction has been extended",
            status: "sent"
        },
        {
            notifyId: "NOT009NF",
            date: "2023-10-23",
            time: "12:10",
            title: "Terms & Conditions Update",
            type: "Policy Change",
            revisers: "All Users",
            content: "Terms and conditions have been updated",
            status: "sent"
        },
        {
            notifyId: "NOT010NF",
            date: "2023-10-24",
            time: "08:30",
            title: "Weekly Auction Summary",
            type: "Report",
            revisers: "Administrators",
            content: "Weekly auction summary is ready",
            status: "sent"
        }
    ];

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