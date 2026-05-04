"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    AlertTriangle,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Shield,
    Clock,
    CheckCircle,
    Loader2,
} from "lucide-react";
import { ViolationCard } from "@/components/admincomponents/violationcard";
import { apiClient } from "@/lib/apiClient";

/* ================= TYPES ================= */
type ViolationItem = {
    violation_id: string;
    sender_id: string;
    sender_name?: string | null;
    sender_email?: string | null;
    violator_id: string;
    auction_id?: string | null;
    violation_type: string;
    reason: string;
    status: string;
    created_at: string;
};

/* ================= MAIN COMPONENT ================= */
export default function ViolationHandlingPage() {
    const [violations, setViolations] = useState<ViolationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [currentPage, setCurrentPage] = useState(1);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const itemsPerPage = 5;

    /* ================= FETCH ================= */
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

    /* ================= FILTERS ================= */
    const uniqueTypes = useMemo(
        () => Array.from(new Set(violations.map(v => v.violation_type))),
        [violations]
    );

    const filteredViolations = useMemo(() => {
        let filtered = [...violations];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(v =>
                [
                    v.sender_id,
                    v.violator_id,
                    v.reason,
                    v.violation_id,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(search)
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(
                v => v.status?.toLowerCase() === statusFilter
            );
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(
                v => v.violation_type === typeFilter
            );
        }

        return filtered;
    }, [violations, searchTerm, statusFilter, typeFilter]);

    /* ================= STATS ================= */
    const stats = useMemo(() => ({
        total: violations.length,
        pending: violations.filter(v => v.status?.toLowerCase() === "pending").length,
        resolved: violations.filter(v => v.status?.toLowerCase() === "resolved").length,
        review: violations.filter(v => v.status?.toLowerCase() === "under review").length,
        high: violations.filter(v =>
            v.violation_type?.toLowerCase().includes("fraud") ||
            v.violation_type?.toLowerCase().includes("scam")
        ).length,
    }), [violations]);

    /* ================= PAGINATION ================= */
    const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);

    const paginated = filteredViolations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /* ================= UPDATE ================= */
    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await apiClient.patch(`/admin/violations/${id}`, { status });

            setViolations(prev =>
                prev.map(v =>
                    v.violation_id === id ? { ...v, status } : v
                )
            );
        } catch (err) {
            console.error("Error updating status:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTypeFilter("all");
    };

    const hasFilters =
        searchTerm !== "" ||
        statusFilter !== "all" ||
        typeFilter !== "all";

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-green-600" />
            </div>
        );
    }

    /* ================= UI ================= */
    return (
        <div className="p-6 max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-red-500" />
                    Violation Handling
                </h1>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Stat label="Total" value={stats.total} icon={<AlertTriangle />} />
                <Stat label="Pending" value={stats.pending} icon={<Clock />} />
                <Stat label="Resolved" value={stats.resolved} icon={<CheckCircle />} />
                <Stat label="Review" value={stats.review} icon={<Shield />} />
                <Stat label="High Risk" value={stats.high} icon={<TrendingUp />} />
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-3">

                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2 top-2 text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 p-2 border rounded w-full"
                        placeholder="Search violations..."
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="under review">Under Review</option>
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="all">All Types</option>
                    {uniqueTypes.map(t => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-red-500"
                    >
                        <X /> Clear
                    </button>
                )}
            </div>

            {/* LIST */}
            {paginated.length === 0 ? (
                <p className="text-center text-gray-500">No violations found</p>
            ) : (
                <div className="space-y-4">
                    {paginated.map(v => (
                        <ViolationCard
                            key={v.violation_id}
                            violationId={v.violation_id}
                            senderId={v.sender_id}
                            violatorId={v.violator_id}
                            violationType={v.violation_type}
                            reason={v.reason}
                            status={v.status}
                            timestamp={v.created_at}
                            onStatusUpdate={(status) =>
                                updateStatus(v.violation_id, status)
                            }
                        />
                    ))}
                </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button onClick={() => changePage(currentPage - 1)}>
                        <ChevronLeft />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => changePage(i + 1)}
                            className={`px-3 py-1 rounded ${currentPage === i + 1
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-200"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button onClick={() => changePage(currentPage + 1)}>
                        <ChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ================= STAT COMPONENT ================= */
function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: ReactNode;
}) {
    return (
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
            <div className="text-gray-400">{icon}</div>
        </div>
    );
}