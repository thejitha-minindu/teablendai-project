"use client";

import Link from "next/link";
import { 
  AlertTriangle, 
  Send, 
  User, 
  Flag, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Shield,
  Eye,
  MessageCircle
} from "lucide-react";
import { useState } from "react";

type ViolationCardProps = {
    violationId: string;
    senderId: string;
    violatorId: string;
    violationType: string;
    reason: string;
    status: string;
    timestamp?: string;
    onStatusUpdate?: (violationId: string, newStatus: string) => void;
};

export function ViolationCard({
    violationId,
    senderId,
    violatorId,
    violationType,
    reason,
    status,
    timestamp,
    onStatusUpdate
}: ViolationCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(status);
    const [updating, setUpdating] = useState(false);

    const getStatusColor = () => {
        switch (currentStatus.toLowerCase()) {
            case "pending":
                return { bg: "bg-yellow-100", text: "text-yellow-700", icon: <Clock className="w-3 h-3" /> };
            case "resolved":
                return { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle className="w-3 h-3" /> };
            case "under review":
                return { bg: "bg-blue-100", text: "text-blue-700", icon: <Shield className="w-3 h-3" /> };
            case "dismissed":
                return { bg: "bg-gray-100", text: "text-gray-700", icon: <XCircle className="w-3 h-3" /> };
            default:
                return { bg: "bg-gray-100", text: "text-gray-700", icon: null };
        }
    };

    const getViolationTypeColor = () => {
        if (violationType.toLowerCase().includes("fraud") || violationType.toLowerCase().includes("scam")) {
            return "bg-red-100 text-red-700";
        }
        if (violationType.toLowerCase().includes("spam")) {
            return "bg-orange-100 text-orange-700";
        }
        if (violationType.toLowerCase().includes("harassment")) {
            return "bg-purple-100 text-purple-700";
        }
        return "bg-blue-100 text-blue-700";
    };

    const statusStyle = getStatusColor();

    const handleStatusChange = async (newStatus: string) => {
        try {
            setUpdating(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setCurrentStatus(newStatus);
            onStatusUpdate?.(violationId, newStatus);
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = (timestamp?: string) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 w-full border-l-4 border-red-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                                Violation Report
                            </h3>
                            <span className="text-xs text-gray-400 font-mono">#{violationId}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getViolationTypeColor()}`}>
                                <div className="flex items-center gap-1">
                                    <Flag className="w-3 h-3" />
                                    {violationType}
                                </div>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                <div className="flex items-center gap-1">
                                    {statusStyle.icon}
                                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {timestamp && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(timestamp)}
                    </div>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Sender ID:</span> {senderId}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Violator ID:</span> {violatorId}
                        </span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Flag className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Violation Type:</span> {violationType}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Status:</span> {currentStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* Reason Section */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Reason for violation:</p>
                        <p className="text-sm text-gray-700">{reason}</p>
                    </div>
                </div>
            </div>

            {/* Expandable Details */}
            <div className="mt-3">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-green-600 hover:text-green-700 transition-colors flex items-center gap-1"
                >
                    <Eye className="w-3 h-3" />
                    {expanded ? "Show less" : "View evidence"}
                </button>
                {expanded && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500">Additional evidence will be displayed here</p>
                            <div className="flex gap-2">
                                <button className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
                                    View Screenshot
                                </button>
                                <button className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition">
                                    View Chat Log
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Actions */}
            {currentStatus !== "resolved" && currentStatus !== "dismissed" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Update Violation Status:
                    </p>
                    <div className="flex gap-2">
                        {currentStatus !== "under review" && (
                            <button
                                onClick={() => handleStatusChange("under review")}
                                disabled={updating}
                                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                            >
                                Mark as Under Review
                            </button>
                        )}
                        <button
                            onClick={() => handleStatusChange("resolved")}
                            disabled={updating}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
                        >
                            Resolve Issue
                        </button>
                        <button
                            onClick={() => handleStatusChange("dismissed")}
                            disabled={updating}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-4 flex justify-end gap-3">
                <Link href={`/admin/sendnotification?senderId=${senderId}&violatorId=${violatorId}&type=${violationType}`}>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-600 text-green-600 hover:bg-green-50 transition-all duration-200">
                        <Send className="w-4 h-4" />
                        Send Notification
                    </button>
                </Link>
                <Link href={`/admin/userprofile/${violatorId}`}>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">
                        <User className="w-4 h-4" />
                        View Violator Profile
                    </button>
                </Link>
            </div>

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