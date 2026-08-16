"use client";

import { useEffect, useState } from "react";
import { UserCard } from "@/components/admincomponents/UserCard";
import { Loader2, RefreshCw, Filter } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function VerificationPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"all" | "seller" | "buyer">("all");
    const [filterStats, setFilterStats] = useState({ sellers: 0, buyers: 0 });

    const fetchUsers = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await apiClient.get("/admin/users/pending");
            const data = response.data;
            console.log("API RESPONSE:", data);
            const usersData = data.users || data.data || [];
            setUsers(usersData);
            
            // Calculate stats
            const sellers = usersData.filter((user: any) => user.role?.toLowerCase() === "seller").length;
            const buyers = usersData.filter((user: any) => user.role?.toLowerCase() === "buyer").length;
            setFilterStats({ sellers, buyers });
            
            // Apply current filter
            applyFilter(activeFilter, usersData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users");
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilter = (filter: "all" | "seller" | "buyer", usersList = users) => {
        setActiveFilter(filter);
        
        if (filter === "all") {
            setFilteredUsers(usersList);
        } else {
            const filtered = usersList.filter(
                (user: any) => user.role?.toLowerCase() === filter
            );
            setFilteredUsers(filtered);
        }
    };

    const handleFilterChange = (filter: "all" | "seller" | "buyer") => {
        applyFilter(filter, users);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserUpdate = (userId: string, newStatus: string) => {
        if (newStatus === "approved" || newStatus === "rejected") {
            const updatedUsers = users.filter(user => user.user_id !== userId);
            setUsers(updatedUsers);
            
            // Update stats
            const sellers = updatedUsers.filter((user: any) => user.role?.toLowerCase() === "seller").length;
            const buyers = updatedUsers.filter((user: any) => user.role?.toLowerCase() === "buyer").length;
            setFilterStats({ sellers, buyers });
            
            // Re-apply filter
            applyFilter(activeFilter, updatedUsers);
        }
    };

    if (loading) {
    return null;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => fetchUsers()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">User Verification</h1>
                    <p className="text-gray-500 mt-1">
                        {filteredUsers.length} / {users.length} pending verifications
                    </p>
                </div>
                
                <button
                    onClick={() => fetchUsers(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? '' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filter Section */}
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by Role</span>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={() => handleFilterChange("all")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            activeFilter === "all"
                                ? "bg-[#3A5A40] text-white shadow-md transform scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        All Users
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                            activeFilter === "all" 
                                ? "bg-[#1A2F1C] text-white" 
                                : "bg-gray-300 text-gray-700"
                        }`}>
                            {users.length}
                        </span>
                    </button>

                    <button
                        onClick={() => handleFilterChange("seller")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            activeFilter === "seller"
                                ? "bg-[#3A5A40] text-white shadow-md transform scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Sellers
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                            activeFilter === "seller" 
                                ? "bg-[#1A2F1C] text-white" 
                                : "bg-gray-300 text-gray-700"
                        }`}>
                            {filterStats.sellers}
                        </span>
                    </button>

                    <button
                        onClick={() => handleFilterChange("buyer")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                            activeFilter === "buyer"
                                ? "bg-[#3A5A40] text-white shadow-md transform scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Buyers
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                            activeFilter === "buyer" 
                                ? "bg-[#1A2F1C] text-white" 
                                : "bg-gray-300 text-gray-700"
                        }`}>
                            {filterStats.buyers}
                        </span>
                    </button>
                </div>

                {/* Active filter indicator */}
                {activeFilter !== "all" && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#3A5A40] "></span>
                        Showing {activeFilter}s only
                        <button
                            onClick={() => handleFilterChange("all")}
                            className="text-[#3A5A40] hover:text-[#1A2F1C] underline ml-2"
                        >
                            Clear filter
                        </button>
                    </div>
                )}
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    {activeFilter !== "all" ? (
                        <>
                            <h3 className="text-lg font-semibold text-gray-600">
                                No {activeFilter}s Pending
                            </h3>
                            <p className="text-gray-400 mt-2">
                                There are currently no {activeFilter}s waiting for verification.
                            </p>
                            <button
                                onClick={() => handleFilterChange("all")}
                                className="mt-4 px-4 py-2 text-sm bg-[#3A5A40] text-white rounded-lg hover:bg-[#1A2F1C] transition-colors"
                            >
                                View All Users
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-semibold text-gray-600">No Pending Verifications</h3>
                            <p className="text-gray-400 mt-2">All users have been verified or rejected</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.map((user: any) => (
                        <UserCard
                            key={user.user_id}
                            name={`${user.first_name} ${user.last_name}`}
                            id={user.user_id}
                            email={user.email}
                            first_name={user.first_name}
                            last_name={user.last_name}
                            username={user.username}
                            role={user.role}
                            onStatusChange={handleUserUpdate}
                        />
                    ))}
                </div>
            )}

            {/* Quick Stats Footer */}
            {users.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-[#3A5A40] rounded-full"></div>
                                <span>Sellers: {filterStats.sellers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-[#1A2F1C] rounded-full"></div>
                                <span>Buyers: {filterStats.buyers}</span>
                            </div>
                        </div>
                        <div>
                            Total Pending: {users.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}