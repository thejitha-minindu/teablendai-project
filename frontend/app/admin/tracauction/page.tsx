"use client";

import { useEffect, useState } from "react";
import { TrackAuctionCard } from "@/components/admincomponents/TrackAuctionCard";
import { Search, Filter, Calendar, DollarSign, Package, X, ChevronDown } from "lucide-react";

type Auction = {
    auction_id: string;
    auction_name: string;
    estate_name: string;
    grade: string;
    quantity: number;
    base_price: number;
    start_time: string;
    status: string;
    buyer?: string;
    sold_price?: number;
    custom_auction_id?: string;
};

export default function TrackAuctionPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [gradeFilter, setGradeFilter] = useState<string>("all");
    const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
    const [showFilters, setShowFilters] = useState(false);
    const [filterStats, setFilterStats] = useState({ total: 0, live: 0, history: 0, scheduled: 0 });

    // Extract unique grades for filter
    const uniqueGrades = Array.from(new Set(auctions.map(a => a.grade).filter(Boolean)));

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/v1/admin/auctions");
                const data = await res.json();
                console.log("API DATA:", data);
                const auctionsData = Array.isArray(data) ? data : data.auctions || [];
                setAuctions(auctionsData);
                applyFilters(auctionsData, searchTerm, statusFilter, gradeFilter, priceRange);
            } catch (error) {
                console.error("Error fetching auctions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuctions();
    }, []);

    const applyFilters = (
        auctionsList: Auction[],
        search: string,
        status: string,
        grade: string,
        price: { min: string; max: string }
    ) => {
        let filtered = [...auctionsList];

        // Search filter
        if (search) {
            filtered = filtered.filter(
                (auction) =>
                    auction.auction_name.toLowerCase().includes(search.toLowerCase()) ||
                    auction.estate_name.toLowerCase().includes(search.toLowerCase()) ||
                    auction.custom_auction_id?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Status filter
        if (status !== "all") {
            filtered = filtered.filter((auction) => auction.status.toLowerCase() === status.toLowerCase());
        }

        // Grade filter
        if (grade !== "all") {
            filtered = filtered.filter((auction) => auction.grade === grade);
        }

        // Price range filter
        if (price.min) {
            filtered = filtered.filter((auction) => auction.base_price >= parseFloat(price.min));
        }
        if (price.max) {
            filtered = filtered.filter((auction) => auction.base_price <= parseFloat(price.max));
        }

        setFilteredAuctions(filtered);

        // Update stats
        const stats = {
            total: auctionsList.length,
            live: auctionsList.filter((a) => a.status.toLowerCase() === "live").length,
            history: auctionsList.filter((a) => a.status.toLowerCase() === "history").length,
            scheduled: auctionsList.filter((a) => a.status.toLowerCase() === "scheduled").length,
        };
        setFilterStats(stats);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        applyFilters(auctions, term, statusFilter, gradeFilter, priceRange);
    };

    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        applyFilters(auctions, searchTerm, status, gradeFilter, priceRange);
    };

    const handleGradeChange = (grade: string) => {
        setGradeFilter(grade);
        applyFilters(auctions, searchTerm, statusFilter, grade, priceRange);
    };

    const handlePriceChange = (type: "min" | "max", value: string) => {
        const newRange = { ...priceRange, [type]: value };
        setPriceRange(newRange);
        applyFilters(auctions, searchTerm, statusFilter, gradeFilter, newRange);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setGradeFilter("all");
        setPriceRange({ min: "", max: "" });
        applyFilters(auctions, "", "all", "all", { min: "", max: "" });
    };

    const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || gradeFilter !== "all" || priceRange.min !== "" || priceRange.max !== "";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading auctions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Track Auctions</h1>
                <p className="text-gray-500 mt-1">
                    Monitor and manage all auction activities
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <p className="text-xs text-gray-500">Total Auctions</p>
                    <p className="text-2xl font-bold text-gray-800">{filterStats.total}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <p className="text-xs text-gray-500">Live</p>
                    <p className="text-2xl font-bold text-green-600">{filterStats.live}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                    <p className="text-xs text-gray-500">History</p>
                    <p className="text-2xl font-bold text-purple-600">{filterStats.history}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                    <p className="text-xs text-gray-500">Scheduled</p>
                    <p className="text-2xl font-bold text-yellow-600">{filterStats.scheduled}</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by auction name, estate, or reference ID..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            showFilters || hasActiveFilters
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-1 px-1.5 py-0.5 bg-white text-green-600 rounded-full text-xs font-bold">
                                {[
                                    statusFilter !== "all" ? 1 : 0,
                                    gradeFilter !== "all" ? 1 : 0,
                                    priceRange.min || priceRange.max ? 1 : 0,
                                ].reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="border-t pt-4 mt-2 animate-slideDown">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="live">Live</option>
                                    <option value="history">History</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Grade Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grade
                                </label>
                                <select
                                    value={gradeFilter}
                                    onChange={(e) => handleGradeChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="all">All Grades</option>
                                    {uniqueGrades.map((grade) => (
                                        <option key={grade} value={grade}>
                                            {grade}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Base Price Range ($)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => handlePriceChange("min", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <span className="text-gray-500 self-center">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => handlePriceChange("max", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                    Showing {filteredAuctions.length} of {auctions.length} auctions
                </p>
            </div>

            {/* Auction List */}
            {filteredAuctions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No auctions found</h3>
                    <p className="text-gray-400">
                        Try adjusting your search or filter criteria
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
                    {filteredAuctions.map((auction) => (
                        <TrackAuctionCard
                            key={auction.auction_id}
                            auctionName={auction.auction_name}
                            estateName={auction.estate_name}
                            grade={auction.grade}
                            quantity={auction.quantity}
                            basePrice={auction.base_price}
                            startTime={auction.start_time}
                            status={auction.status}
                            buyer={auction.buyer}
                            soldPrice={auction.sold_price}
                            customAuctionId={auction.custom_auction_id}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}