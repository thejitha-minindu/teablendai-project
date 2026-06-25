"use client";

import Link from "next/link";
import { toast } from 'sonner';
import {
} from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/apiClient";

type ViolationCardProps = {
    violationId: string;
    senderId: string;
    senderName?: string | null;
    senderEmail?: string | null;
    violatorId: string;
    violatorName?: string | null;
    violatorEmail?: string | null;
    violatorFirstName?: string | null;
    violatorLastName?: string | null;
    auctionId?: string | null;
    violationType: string;
    reason: string;
    status: string;
    timestamp?: string;
    onStatusUpdate?: (violationId: string, newStatus: string) => void;
};

export function ViolationCard({
    violationId,
    senderId,
    senderName,
    senderEmail,
    violatorId,
    violatorName,
    violatorEmail,
    violatorFirstName,
    violatorLastName,
    auctionId,
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
            case "open":
            case "pending":
                return { bg: "bg-[#F5F7EB]", text: "text-[#3A5A40]", icon: null };
            case "resolved":
                return { bg: "bg-[#E5F7CB]", text: "text-[#1A2F1C]", icon: null };
            case "under review":
                return { bg: "bg-gray-100", text: "text-[#3A5A40]", icon: null };
            case "closed":
            case "dismissed":
                return { bg: "bg-gray-100", text: "text-gray-700", icon: null };
            default:
                return { bg: "bg-gray-100", text: "text-gray-700", icon: null };
        }
    };

    const getViolationTypeColor = () => {
        return "bg-gray-100 text-[#3A5A40]";
    };

    const statusStyle = getStatusColor();

    const handleStatusChange = async (newStatus: string) => {
        try {
            setUpdating(true);
            await apiClient.patch(`/admin/violations/${violationId}`, {
                status: newStatus,
            });
            setCurrentStatus(newStatus);
            onStatusUpdate?.(violationId, newStatus);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update violation status. Please try again.");
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
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 w-full border-l-4 border-red-600">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
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
                        {formatDate(timestamp)}
                    </div>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                            <span className="font-medium">Reported By:</span>{" "}
                            {senderName || senderId}
                            {senderEmail && (
                                <span className="text-gray-400 text-xs ml-1">({senderEmail})</span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                            <span className="font-medium">Violator:</span>{" "}
                            {violatorName || violatorId}
                            {violatorEmail && (
                                <span className="text-gray-400 text-xs ml-1">({violatorEmail})</span>
                            )}
                        </span>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                            <span className="font-medium">Violation Type:</span> {violationType}
                        </span>
                    </div>
                    {auctionId && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">
                                <span className="font-medium">Auction ID:</span> {auctionId}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                            <span className="font-medium">Status:</span> {currentStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* Reason Section */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Reason for violation:</p>
                        <p className="text-sm text-gray-700">{reason}</p>
                    </div>
                </div>
            </div>

            {/* Status Update Actions */}
            {currentStatus !== "Resolved" && currentStatus !== "Closed" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        Update Violation Status:
                    </p>
                    <div className="flex gap-2">
                        {currentStatus !== "Under Review" && (
                            <button
                                onClick={() => handleStatusChange("Under Review")}
                                disabled={updating}
                                className="text-xs px-3 py-1 bg-gray-100 text-[#3A5A40] rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                Mark as Under Review
                            </button>
                        )}
                        <button
                            onClick={() => handleStatusChange("Resolved")}
                            disabled={updating}
                            className="text-xs px-3 py-1 bg-[#E5F7CB] text-[#1A2F1C] rounded-lg hover:bg-[#D5ECA8] transition disabled:opacity-50"
                        >
                            Resolve Issue
                        </button>
                        <button
                            onClick={() => handleStatusChange("Closed")}
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
                <Link href={`/admin/sendnotification?prefillUserId=${violatorId}&prefillUserEmail=${encodeURIComponent(violatorEmail || "")}&prefillFirstName=${encodeURIComponent(violatorFirstName || "")}&prefillLastName=${encodeURIComponent(violatorLastName || "")}`}>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3A5A40] text-[#3A5A40] hover:bg-gray-50 transition-all duration-200">
                        Send Notification
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