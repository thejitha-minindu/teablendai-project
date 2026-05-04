"use client";

import { useEffect, useState } from "react";
import { ViolationCard } from "@/components/admincomponents/violationcard";
import { apiClient } from "@/lib/apiClient";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";

export default function ViolationHandlingPage() {
    const [violations, setViolations] = useState<any[]>([]);
    const [filteredViolations, setFilteredViolations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchViolations();
    }, []);

    const fetchViolations = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get("/admin/violations");
            const data = res.data;
            setViolations(Array.isArray(data) ? data : data.violations || []);
        } catch (err) {
            console.error("Error fetching violations:", err);
        } finally {
            setLoading(false);
        }
    };

    // Get unique violation types
    const uniqueTypes = Array.from(new Set(violations.map(v => v.violationType)));

    // Apply filters
    useEffect(() => {
        let filtered = [...violations];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(violation =>
                violation.senderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                violation.violatorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                violation.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                violation.violationId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(violation => 
                violation.status?.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(violation => 
                violation.violationType === typeFilter
            );
        }

        setFilteredViolations(filtered);
        setCurrentPage(1);
    }, [violations, searchTerm, statusFilter, typeFilter]);

    // Calculate statistics
    const stats = {
        total: violations.length,
        pending: violations.filter(v => v.status?.toLowerCase() === "pending").length,
        resolved: violations.filter(v => v.status?.toLowerCase() === "resolved").length,
        underReview: violations.filter(v => v.status?.toLowerCase() === "under review").length,
        highPriority: violations.filter(v => v.violationType?.toLowerCase().includes("fraud") || 
                                              v.violationType?.toLowerCase().includes("scam")).length
    };

    // Pagination
    const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedViolations = filteredViolations.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTypeFilter("all");
    };

    const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || typeFilter !== "all";

    const handleStatusUpdate = (violationId: string, newStatus: string) => {
        setViolations(prevViolations =>
            prevViolations.map(violation =>
                violation.violationId === violationId || violation.violation_id === violationId
                    ? { ...violation, status: newStatus }
                    : violation
            )
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading violations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                    Violation Handling
                </h1>
                <p className="text-gray-500 mt-1">Monitor and manage user violations</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Total Violations</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Resolved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Under Review</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.underReview}</p>
                        </div>
                        <Shield className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">High Priority</p>
                            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-red-400" />
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
                            placeholder="Search by Sender ID, Violator ID, Reason, or Violation ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="under review">Under Review</option>
                        <option value="dismissed">Dismissed</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
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
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                    Showing {paginatedViolations.length} of {filteredViolations.length} violations
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Active Cases: {stats.pending + stats.underReview}</span>
                </div>
            </div>

            {/* Violations List */}
            {paginatedViolations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No violations found</h3>
                    <p className="text-gray-400">
                        {hasActiveFilters ? "Try adjusting your search or filter criteria" : "All clear! No violations to display"}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedViolations.map((violation) => (
                        <ViolationCard
                            key={violation.violation_id || violation.violationId}
                            violationId={violation.violation_id || violation.violationId}
                            senderId={violation.senderId || violation.sender_id}
                            violatorId={violation.violatorId || violation.violator_id}
                            violationType={violation.violationType || violation.violation_type}
                            reason={violation.reason}
                            status={violation.status}
                            timestamp={violation.created_at || violation.timestamp}
                            onStatusUpdate={handleStatusUpdate}
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