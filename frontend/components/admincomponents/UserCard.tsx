"use client";

import { MoreVertical, User, FileText, Link, CheckCircle, XCircle, Loader2, Eye, EyeOff, Store, ShoppingBag } from "lucide-react";
import { useState } from "react";

type UserCardProps = {
    name: string;
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role?: string;
    onStatusChange?: (userId: string, status: string) => void;
};

export function UserCard({ name, id, email, first_name, last_name, username, role = "buyer", onStatusChange }: UserCardProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
    const [showDetails, setShowDetails] = useState(false);
    const [confirmAction, setConfirmAction] = useState<"verify" | "reject" | null>(null);

    const isSeller = role?.toLowerCase() === "seller";
    const roleColor = isSeller ? "purple" : "green";
    const RoleIcon = isSeller ? Store : ShoppingBag;

    const verifyUser = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/admin/users/approve/${id}`, { method: "PUT" });

            if (!res.ok) throw new Error("Verification failed");

            setStatus("approved");
            onStatusChange?.(id, "approved");
            
            const event = new CustomEvent('showToast', { 
                detail: { message: `${name} (${role}) verified successfully!`, type: 'success' }
            });
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error(error);
            const event = new CustomEvent('showToast', { 
                detail: { message: "Failed to verify user", type: 'error' }
            });
            window.dispatchEvent(event);
        } finally {
            setLoading(false);
            setConfirmAction(null);
        }
    };

    const rejectUser = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:8000/admin/users/reject/${id}`, { method: "PUT" });

            if (!res.ok) throw new Error("Reject failed");

            setStatus("rejected");
            onStatusChange?.(id, "rejected");
            
            const event = new CustomEvent('showToast', { 
                detail: { message: `${name} (${role}) rejected`, type: 'warning' }
            });
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error(error);
            const event = new CustomEvent('showToast', { 
                detail: { message: "Failed to reject user", type: 'error' }
            });
            window.dispatchEvent(event);
        } finally {
            setLoading(false);
            setConfirmAction(null);
        }
    };

    return (
        <>
            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl animate-slideUp">
                        <h3 className="text-xl font-semibold mb-3">
                            {confirmAction === "verify" ? "Verify User" : "Reject User"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to {confirmAction} {name} ({role})? 
                            {confirmAction === "reject" && " This action cannot be undone."}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction === "verify" ? verifyUser : rejectUser}
                                className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${
                                    confirmAction === "verify" 
                                        ? "bg-green-600 hover:bg-green-700 text-white" 
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                }`}
                            >
                                Confirm {confirmAction}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Card */}
            <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-5 w-full border-l-4 ${
                status === "approved" ? "border-green-500" : 
                status === "rejected" ? "border-red-500" : 
                isSeller ? "border-purple-500" : "border-green-500"
            }`}>
                <div className="flex gap-4">
                    {/* Avatar with Role Badge */}
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            status === "approved" ? "bg-green-100" : 
                            status === "rejected" ? "bg-red-100" : 
                            isSeller ? "bg-purple-100" : "bg-green-100"
                        }`}>
                            <RoleIcon className={`w-6 h-6 ${
                                status === "approved" ? "text-green-600" : 
                                status === "rejected" ? "text-red-600" : 
                                isSeller ? "text-purple-600" : "text-green-600"
                            }`} />
                        </div>
                        
                        {/* Role Badge */}
                        <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isSeller 
                                ? "bg-purple-500 text-white" 
                                : "bg-green-500 text-white"
                        }`}>
                            {role}
                        </div>
                        
                        {status === "approved" && (
                            <CheckCircle className="w-4 h-4 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
                        )}
                        {status === "rejected" && (
                            <XCircle className="w-4 h-4 text-red-500 absolute -top-1 -right-1 bg-white rounded-full" />
                        )}
                    </div>

                    {/* User Details */}
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg text-gray-800">{name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        isSeller 
                                            ? "bg-purple-100 text-purple-700" 
                                            : "bg-green-100 text-green-700"
                                    }`}>
                                        {isSeller ? "Seller" : "Buyer"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono mt-1">ID: {id}</p>
                            </div>
                            
                            {/* Action Icons */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                    title={showDetails ? "Hide details" : "Show details"}
                                >
                                    {showDetails ? 
                                        <EyeOff className="w-4 h-4 text-gray-500 group-hover:text-gray-700" /> : 
                                        <Eye className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                                    }
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                                    <Link className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                                    <FileText className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                                    <MoreVertical className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        <div className={`mt-3 space-y-2 overflow-hidden transition-all duration-300 ${
                            showDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700">First Name:</span>{' '}
                                    <span className="text-gray-600">{first_name}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700">Last Name:</span>{' '}
                                    <span className="text-gray-600">{last_name}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700">Email:</span>{' '}
                                    <span className="text-gray-600">{email}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700">Username:</span>{' '}
                                    <span className="text-gray-600">@{username}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700">Role:</span>{' '}
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                        isSeller 
                                            ? "bg-purple-100 text-purple-700" 
                                            : "bg-green-100 text-green-700"
                                    }`}>
                                        <RoleIcon className="w-3 h-3" />
                                        {role}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Status Message */}
                        {status === "approved" && (
                            <div className="mt-3 text-sm bg-green-50 text-green-700 p-2 rounded-lg animate-slideDown">
                                ✓ {role} has been verified
                            </div>
                        )}
                        {status === "rejected" && (
                            <div className="mt-3 text-sm bg-red-50 text-red-700 p-2 rounded-lg animate-slideDown">
                                ✗ {role} has been rejected
                            </div>
                        )}
                        {status === "pending" && (
                            <p className="text-xs text-gray-400 mt-2">
                                Please review {role} documentation before verifying
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {status === "pending" && (
                    <div className="flex gap-3 mt-4 justify-end">
                        <button
                            onClick={() => setConfirmAction("reject")}
                            disabled={loading}
                            className="px-5 py-2 border-2 border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => setConfirmAction("verify")}
                            disabled={loading}
                            className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 transform hover:scale-105 shadow-md hover:shadow-lg ${
                                isSeller 
                                    ? "bg-purple-600 hover:bg-purple-700" 
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            ) : null}
                            Verify {isSeller ? "Seller" : "Buyer"}
                        </button>
                    </div>
                )}

                {/* Loading overlay for card */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-xl">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-slideUp { animation: slideUp 0.3s ease-out; }
                .animate-slideDown { animation: slideDown 0.3s ease-out; }
            `}</style>
        </>
    );
}