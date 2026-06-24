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
  Shield,
  LogIn,
  LogOut,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  UserX,
  UserCheck
} from "lucide-react";
import { SystemLog } from "@/types/admin/system-log.types";

interface SystemLogCardProps {
  log: SystemLog;
}

export default function SystemLogCard({ log }: SystemLogCardProps) {
  const { id, userName, activityType, timestamp, status, ipAddress, details } = log;

  const getActivityIcon = () => {
    switch (activityType.toLowerCase()) {
      case "login":
        return <LogIn className="w-5 h-5 text-emerald-600" />;
      case "logout":
        return <LogOut className="w-5 h-5 text-gray-500" />;
      case "bid placed":
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case "document upload":
        return <FileText className="w-5 h-5 text-orange-600" />;
      case "payment processed":
        return <CreditCard className="w-5 h-5 text-teal-600" />;
      case "system settings changed":
        return <Settings className="w-5 h-5 text-amber-600" />;
      case "user verified":
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case "user deleted":
        return <UserX className="w-5 h-5 text-red-600" />;
      case "profile updated":
        return <User className="w-5 h-5 text-sky-600" />;
      case "auction created":
      case "product listed":
        return <PlusCircle className="w-5 h-5 text-emerald-600" />;
      case "auction cancelled":
        return <RotateCcw className="w-5 h-5 text-rose-600" />;
      case "violation flagged":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "violation resolved":
        return <Shield className="w-5 h-5 text-green-600" />;
      case "password reset":
        return <RotateCcw className="w-5 h-5 text-violet-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "error":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
  };

  const getLeftBorderColor = () => {
    switch (status) {
      case "success":
        return "border-l-emerald-500";
      case "warning":
        return "border-l-amber-500";
      case "error":
        return "border-l-rose-500";
      default:
        return "border-l-emerald-500";
    }
  };

  const formatDate = (ts: string) => {
    try {
      const dateObj = new Date(ts.replace(" ", "T"));
      return {
        dateStr: dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        timeStr: dateObj.toLocaleTimeString()
      };
    } catch {
      return { dateStr: ts, timeStr: "" };
    }
  };

  const { dateStr, timeStr } = formatDate(timestamp);

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-5 w-full border border-gray-100 border-l-4 ${getLeftBorderColor()} animate-fadeInSlide`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* User Info / Icon */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
            {getActivityIcon()}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-semibold text-gray-800">
                {userName}
              </h3>
              <span className="text-xs text-gray-400 font-mono">#{id}</span>
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                <span className="flex items-center gap-1.5">
                  {getStatusIcon()}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </span>
              {ipAddress && (
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-mono">
                  IP: {ipAddress}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium sm:self-center shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Activity Details */}
      <div className="mt-4 sm:pl-[3.25rem]">
        <div className="bg-gray-50/50 rounded-lg border border-gray-100 p-4">
          <div className="flex items-start gap-2.5">
            <Activity className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Activity:</span> {activityType}
            </div>
          </div>
          <div className="flex items-start gap-2.5 mt-2">
            <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Details:</span> {details}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
