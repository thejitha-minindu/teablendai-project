"use client";

import { 
  Activity, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Settings,
  CreditCard,
  Users,
  LogIn,
  Shield
} from "lucide-react";
import { useState } from "react";

type UseractivityCardProps = {
    id: string;
    userName: string;
    activityType: string;
    timestamp: string;
    status?: string;
    ipAddress?: string;
    details?: string;
};

export function UseractivityCard({ 
    id, 
    userName, 
    activityType, 
    timestamp, 
    status = "success",
    ipAddress,
    details
}: UseractivityCardProps) {
    const [expanded, setExpanded] = useState(false);

    const getActivityIcon = () => {
        switch (activityType.toLowerCase()) {
            case "login":
                return <LogIn className="w-5 h-5 text-blue-600" />;
            case "bid placed":
                return <TrendingUp className="w-5 h-5 text-purple-600" />;
            case "document upload":
                return <FileText className="w-5 h-5 text-orange-600" />;
            case "payment processed":
                return <CreditCard className="w-5 h-5 text-green-600" />;
            case "system settings changed":
                return <Settings className="w-5 h-5 text-red-600" />;
            case "user verified":
                return <Shield className="w-5 h-5 text-green-600" />;
            case "profile updated":
                return <User className="w-5 h-5 text-blue-600" />;
            default:
                return <Activity className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusIcon = () => {
        switch (status.toLowerCase()) {
            case "success":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "warning":
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case "error":
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
    };

    const getStatusColor = () => {
        switch (status.toLowerCase()) {
            case "success":
                return "bg-green-100 text-green-700";
            case "warning":
                return "bg-yellow-100 text-yellow-700";
            case "error":
                return "bg-red-100 text-red-700";
            default:
                return "bg-green-100 text-green-700";
        }
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString()
        };
    };

    const { date, time } = formatDate(timestamp);

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 w-full border-l-4 border-green-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        {getActivityIcon()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                                {userName}
                            </h3>
                            <span className="text-xs text-gray-400 font-mono">#{id}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                                <div className="flex items-center gap-1">
                                    {getStatusIcon()}
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </div>
                            </div>
                            {ipAddress && (
                                <span className="text-xs text-gray-400">IP: {ipAddress}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {time}
                    </div>
                </div>
            </div>

            {/* Activity Details */}
            <div className="ml-13 pl-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Activity:</span> {activityType}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Date:</span> {date}
                        </span>
                    </div>
                </div>

                {/* Expandable Details */}
                {details && (
                    <div className="mt-3">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-green-600 hover:text-green-700 transition-colors flex items-center gap-1"
                        >
                            {expanded ? "Show less" : "View details"}
                        </button>
                        {expanded && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-slideDown">
                                <p className="text-sm text-gray-700">{details}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .ml-13 {
                    margin-left: 3.25rem;
                }
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