"use client";

import { 
  Bell, 
  Calendar, 
  Clock, 
  Users, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Trash2
} from "lucide-react";
import { useState } from "react";

type HistoryCardProps = {
    notifyId: string;
    date: string;
    time: string;
    title: string;
    type: string;
    revisers: string;
    content?: string;
    status?: string;
};

export function HistoryCard({
    notifyId,
    date,
    time,
    title,
    type,
    revisers,
    content,
    status = "sent"
}: HistoryCardProps) {
    const [expanded, setExpanded] = useState(false);

    const getTypeColor = () => {
        switch (type.toLowerCase()) {
            case "reminder":
                return "bg-blue-100 text-blue-700";
            case "alert":
                return "bg-red-100 text-red-700";
            case "announcement":
                return "bg-purple-100 text-purple-700";
            case "update":
                return "bg-green-100 text-green-700";
            case "maintenance":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 w-full border-l-4 border-green-500">
            {/* Header with ID and Date/Time */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs font-mono text-gray-500">{notifyId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {date}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {time}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
                        {type}
                    </div>
                </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg text-gray-800 mb-3">{title}</h3>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                        <span className="font-medium">Type:</span> {type}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                        <span className="font-medium">Audience:</span> {revisers}
                    </span>
                </div>
            </div>

            {/* Expandable Content */}
            {content && (
                <div className="mt-3">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                    >
                        <Eye className="w-3 h-3" />
                        {expanded ? "Show less" : "View content"}
                    </button>
                    {expanded && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
                            <p className="text-sm text-gray-700">{content}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Status Badge */}
            <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {status === "sent" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className={`text-xs font-medium ${status === "sent" ? "text-green-600" : "text-yellow-600"}`}>
                        {status === "sent" ? "Delivered" : "Pending"}
                    </span>
                </div>
                <button className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
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