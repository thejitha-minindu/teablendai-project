"use client";

import { useState } from "react";
import { UseractivityCard } from "@/components/admincomponents/systemactivity";
import { 
  Search, 
  Filter, 
  Activity, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Download,
  X,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  Settings,
  CheckCircle,
  Clock
} from "lucide-react";

export default function SystemActivityPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activityFilter, setActivityFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const activities = [
        {
            id: "ACT001",
            userName: "fx000001 User",
            activityType: "Login",
            timestamp: "2023-10-15 14:30:22",
            status: "success",
            ipAddress: "192.168.1.1",
            details: "User logged in successfully"
        },
        {
            id: "ACT002",
            userName: "fx000002 Admin",
            activityType: "Document Upload",
            timestamp: "2023-10-15 15:45:10",
            status: "success",
            ipAddress: "192.168.1.2",
            details: "Uploaded verification documents"
        },
        {
            id: "ACT003",
            userName: "fx000003 Bidder",
            activityType: "Bid Placed",
            timestamp: "2023-10-15 16:20:33",
            status: "success",
            ipAddress: "192.168.1.3",
            details: "Placed bid on Auction #A123"
        },
        {
            id: "ACT004",
            userName: "fx000004 Viewer",
            activityType: "Auction Viewed",
            timestamp: "2023-10-16 09:15:45",
            status: "success",
            ipAddress: "192.168.1.4",
            details: "Viewed auction details"
        },
        {
            id: "ACT005",
            userName: "fx000005 Moderator",
            activityType: "User Verified",
            timestamp: "2023-10-16 11:30:18",
            status: "success",
            ipAddress: "192.168.1.5",
            details: "Verified new user registration"
        },
        {
            id: "ACT006",
            userName: "fx000006 User",
            activityType: "Profile Updated",
            timestamp: "2023-10-17 13:45:29",
            status: "success",
            ipAddress: "192.168.1.6",
            details: "Updated profile information"
        },
        {
            id: "ACT007",
            userName: "fx000007 Administrator",
            activityType: "System Settings Changed",
            timestamp: "2023-10-17 15:10:55",
            status: "warning",
            ipAddress: "192.168.1.7",
            details: "Modified system configuration"
        },
        {
            id: "ACT008",
            userName: "fx000008 Bidder",
            activityType: "Payment Processed",
            timestamp: "2023-10-18 10:25:37",
            status: "success",
            ipAddress: "192.168.1.8",
            details: "Processed payment of $500"
        },
        {
            id: "ACT009",
            userName: "fx000009 Analyst",
            activityType: "Report Generated",
            timestamp: "2023-10-18 16:40:12",
            status: "success",
            ipAddress: "192.168.1.9",
            details: "Generated monthly report"
        },
        {
            id: "ACT010",
            userName: "fx000010 Support",
            activityType: "Ticket Resolved",
            timestamp: "2023-10-19 12:05:48",
            status: "success",
            ipAddress: "192.168.1.10",
            details: "Resolved support ticket #T123"
        },
        {
            id: "ACT011",
            userName: "fx000011 Seller",
            activityType: "Product Listed",
            timestamp: "2023-10-20 09:30:15",
            status: "success",
            ipAddress: "192.168.1.11",
            details: "Listed new product for auction"
        },
        {
            id: "ACT012",
            userName: "fx000012 Admin",
            activityType: "User Deleted",
            timestamp: "2023-10-20 14:45:22",
            status: "error",
            ipAddress: "192.168.1.12",
            details: "Attempted to delete user account"
        }
    ];

    // Get unique activity types
    const uniqueActivityTypes = Array.from(new Set(activities.map(a => a.activityType)));

    // Filter activities
    const filteredActivities = activities.filter(activity => {
        const matchesSearch = activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             activity.activityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             activity.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesActivity = activityFilter === "all" || activity.activityType === activityFilter;
        
        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && activity.timestamp >= dateRange.start;
        }
        if (dateRange.end) {
            matchesDate = matchesDate && activity.timestamp <= `${dateRange.end} 23:59:59`;
        }
        
        return matchesSearch && matchesActivity && matchesDate;
    });

    // Calculate statistics
    const stats = {
        total: activities.length,
        login: activities.filter(a => a.activityType === "Login").length,
        bids: activities.filter(a => a.activityType === "Bid Placed").length,
        uploads: activities.filter(a => a.activityType === "Document Upload").length
    };

    // Pagination
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setActivityFilter("all");
        setDateRange({ start: "", end: "" });
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm !== "" || activityFilter !== "all" || dateRange.start !== "" || dateRange.end !== "";

    const getActivityIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "login":
                return <Users className="w-4 h-4" />;
            case "bid placed":
                return <TrendingUp className="w-4 h-4" />;
            case "document upload":
                return <FileText className="w-4 h-4" />;
            case "payment processed":
                return <CreditCard className="w-4 h-4" />;
            case "system settings changed":
                return <Settings className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-7 h-7 text-green-700" />
                    System Activity Logs
                </h1>
                <p className="text-gray-500 mt-1">Monitor and track all system activities</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Total Activities</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Logins</p>
                            <p className="text-2xl font-bold text-green-600">{stats.login}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Bids Placed</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.bids}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Documents Uploaded</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.uploads}</p>
                        </div>
                        <FileText className="w-8 h-8 text-orange-400" />
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by user, activity type, or ID..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    
                    <select
                        value={activityFilter}
                        onChange={(e) => {
                            setActivityFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="all">All Activities</option>
                        {uniqueActivityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => {
                            setDateRange({ ...dateRange, start: e.target.value });
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => {
                            setDateRange({ ...dateRange, end: e.target.value });
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="End Date"
                    />

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

            {/* Results Count and Export */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                    Showing {paginatedActivities.length} of {filteredActivities.length} activities
                </p>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                    <Download className="w-4 h-4" />
                    Export Logs
                </button>
            </div>

            {/* Activity List */}
            {paginatedActivities.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No activities found</h3>
                    <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedActivities.map((activity) => (
                        <UseractivityCard 
                            key={activity.id}
                            id={activity.id}
                            userName={activity.userName}
                            activityType={activity.activityType}
                            timestamp={activity.timestamp}
                            status={activity.status}
                            ipAddress={activity.ipAddress}
                            details={activity.details}
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