"use client";

import React, { useEffect, useState } from "react";
import { toast } from 'sonner';
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import {
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  X,
  Shield,
  FileText,
  Flag,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  History,
  User,
  Eye,
  ArrowLeft,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type ViolationTypeOption = {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

type ReportItem = {
  id: string;
  violatorId: string;
  violationType: string;
  reason: string;
  auctionId?: string;
  status: "Open" | "Under Review" | "Resolved" | "Closed";
  date: string;
  rawDate: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

const VIOLATION_TYPES: ViolationTypeOption[] = [
  {
    value: "Fraud",
    label: "Fraud",
    description: "Deceptive practices or false representation",
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-red-600 bg-red-50 border-red-200",
  },
  {
    value: "Scam",
    label: "Scam",
    description: "Intentional schemes to cheat or deceive",
    icon: <Shield className="w-4 h-4" />,
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  {
    value: "Harassment",
    label: "Harassment",
    description: "Unwanted contact or threatening behavior",
    icon: <User className="w-4 h-4" />,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    value: "Fake Product",
    label: "Fake Product",
    description: "Counterfeit or misrepresented products",
    icon: <Flag className="w-4 h-4" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    value: "Payment Issue",
    label: "Payment Issue",
    description: "Payment disputes, non-payment, or overcharges",
    icon: <FileText className="w-4 h-4" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    value: "Other",
    label: "Other",
    description: "Other types of violations",
    icon: <Flag className="w-4 h-4" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
  },
];

// ── Status helpers ─────────────────────────────────────────────────────────

const statusConfig: Record<
  ReportItem["status"],
  { bg: string; text: string; icon: React.ReactNode }
> = {
  Open: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <Clock className="w-3 h-3" />,
  },
  "Under Review": {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    icon: <Eye className="w-3 h-3" />,
  },
  Resolved: {
    bg: "bg-green-50",
    text: "text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  Closed: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    icon: <X className="w-3 h-3" />,
  },
};

// ── Props ──────────────────────────────────────────────────────────────────

type ReportViolationPageProps = {
  /** "buyer" or "seller" — used for styling accents */
  role: "buyer" | "seller";
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ReportViolationPage({ role }: ReportViolationPageProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");

  const searchParams = useSearchParams();

  // Submit form state
  const [violatorId, setViolatorId] = useState(searchParams.get("violatorId") || "");
  const [violationType, setViolationType] = useState("Fraud");
  const [reason, setReason] = useState("");
  const [auctionId, setAuctionId] = useState(searchParams.get("auctionId") || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // History state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  // User suggestions
  type UserOption = { id: string; name: string; email: string };
  const [userSuggestions, setUserSuggestions] = useState<UserOption[]>([]);

  // Accent color
  const accent = role === "buyer" ? "#3A5A40" : "#3A5A40";
  const accentLight =
    role === "buyer" ? "bg-[#E5F7CB]" : "bg-[#E5F7CB]";

  // ── Load violations history ───────────────────────────────────────────
  useEffect(() => {
    loadViolations();
  }, []);

  useEffect(() => {
    loadUserSuggestions();
  }, []);

  const loadViolations = async () => {
    setReportsLoading(true);
    try {
      const response = await apiClient.get("/violations/me");
      const mapped: ReportItem[] = response.data.map((v: any) => ({
        id: v.violation_id,
        violatorId: v.violator_id,
        violationType: v.violation_type,
        reason: v.reason,
        auctionId: v.auction_id ?? "",
        status: v.status as ReportItem["status"],
        date: new Date(v.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }),
        rawDate: v.created_at,
      }));
      setReports(mapped);
    } catch (error) {
      console.error("Failed to load violations:", error);
    } finally {
      setReportsLoading(false);
    }
  };

  const loadUserSuggestions = async () => {
    try {
      const response = await apiClient.get("/users");
      const suggestions = response.data
        .map((user: any) => ({
          id: user.user_id ?? user.id ?? user.uuid,
          name: user.user_name || user.username || "Unknown",
          email: user.email || ""
        }))
        .filter((u: UserOption) => u.id);
      setUserSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to load user suggestions:", error);
    }
  };

  // ── Submit handler ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!violatorId.trim()) {
      toast.error("Please enter the ID of the user you want to report.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("Please provide a detailed reason (at least 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post("/violations", {
        violator_id: violatorId.trim(),
        auction_id: auctionId.trim() || null,
        violation_type: violationType,
        reason: reason.trim(),
      });

      const v = response.data;
      const newReport: ReportItem = {
        id: v.violation_id,
        violatorId: v.violator_id,
        violationType: v.violation_type,
        reason: v.reason,
        auctionId: v.auction_id ?? "",
        status: v.status,
        date: new Date(v.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }),
        rawDate: v.created_at,
      };

      setReports((prev) => [newReport, ...prev]);
      setViolatorId("");
      setViolationType("Fraud");
      setReason("");
      setAuctionId("");
      setSubmitSuccess(true);
      toast.success("Report submitted successfully!");
      setActiveTab("history");
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail || "Failed to submit report.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter reports ────────────────────────────────────────────────────
  const filteredReports = reports.filter((r) => {
    const matchStatus =
      statusFilter === "all" ||
      r.status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch =
      !searchTerm ||
      r.violatorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.violationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "Open").length,
    underReview: reports.filter((r) => r.status === "Under Review").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 animate-fadeInUp">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "#E5F7CB" }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: accent }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Report a Violation
            </h1>
            <p className="text-sm text-gray-500">
              Submit and track violation reports against users or auctions
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fadeInUp"
        style={{ animationDelay: "80ms" }}
      >
        {[
          {
            label: "Total Reports",
            value: stats.total,
            color: "border-gray-300",
            textColor: "text-gray-800",
          },
          {
            label: "Open",
            value: stats.open,
            color: "border-blue-400",
            textColor: "text-blue-700",
          },
          {
            label: "Under Review",
            value: stats.underReview,
            color: "border-yellow-400",
            textColor: "text-yellow-700",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            color: "border-green-400",
            textColor: "text-green-700",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${stat.color} hover:shadow-md transition-shadow`}
          >
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.textColor}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tab Switcher ───────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 mb-6 animate-fadeInUp"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex bg-gray-100 rounded-xl p-1.5 gap-1">
          <button
            onClick={() => setActiveTab("submit")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "submit"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="w-4 h-4" />
            My Reports
            {stats.total > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-600 rounded-full">
                {stats.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Submit Form ────────────────────────────────────────────────── */}
      {activeTab === "submit" && (
        <div
          className="animate-fadeInUp"
          style={{ animationDelay: "160ms" }}
        >
          {/* Success Banner */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-scaleIn">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Report submitted successfully!
                </p>
                <p className="text-xs text-green-600">
                  Our admin team will review your report shortly.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Flag className="w-4 h-4" style={{ color: accent }} />
                  Submit a Violation Report
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  All fields marked with * are required. Reports are reviewed by
                  our admin team.
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Violator ID */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Reported User ID{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={violatorId.toLowerCase()}
                      onChange={(e) => {
                        setViolatorId(e.target.value.toLowerCase());
                        // Clear auction ID if the user manually changes the reported user
                        setAuctionId("");
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] outline-none text-sm transition-all appearance-none"
                      required
                    >
                      <option value="" disabled>Select a user to report...</option>
                      {userSuggestions.map((u) => (
                        <option key={u.id} value={u.id.toLowerCase()}>
                          {u.name} {u.email ? `(${u.email})` : ""}
                        </option>
                      ))}
                      {violatorId && !userSuggestions.find(u => u.id.toLowerCase() === violatorId.toLowerCase()) && (
                        <option value={violatorId.toLowerCase()}>{violatorId} (From Order)</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Auction ID (optional) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Related Auction ID{" "}
                    <span className="text-gray-400 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter auction ID if applicable..."
                      value={auctionId}
                      onChange={(e) => setAuctionId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Violation Type */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Violation Type{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {VIOLATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setViolationType(type.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          violationType === type.value
                            ? `${type.color} border-current shadow-sm scale-[1.02]`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={
                              violationType === type.value
                                ? ""
                                : "text-gray-400"
                            }
                          >
                            {type.icon}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              violationType === type.value
                                ? ""
                                : "text-gray-700"
                            }`}
                          >
                            {type.label}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] leading-tight ${
                            violationType === type.value
                              ? "opacity-80"
                              : "text-gray-400"
                          }`}
                        >
                          {type.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Detailed Reason{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the violation in detail. Include any relevant information such as dates, messages, or transaction details..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={5}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] outline-none text-sm transition-all resize-none"
                    required
                    minLength={5}
                  />
                  <p className="text-[11px] text-gray-400">
                    {reason.length} / 5 minimum characters
                  </p>
                </div>
              </div>

              {/* Form Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <p className="text-[11px] text-gray-400 hidden sm:block">
                  <Shield className="w-3 h-3 inline mr-1" />
                  All reports are confidential and reviewed by our admin team
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: accent }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── History Tab ────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div
          className="animate-fadeInUp"
          style={{ animationDelay: "160ms" }}
        >
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports by ID, violator, type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] outline-none text-sm transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredReports.length}
              </span>{" "}
              of {reports.length} reports
            </p>
          </div>

          {/* Reports List */}
          {reportsLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-sm">Loading your reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No reports found
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {reports.length > 0
                  ? "Try adjusting your search or filter."
                  : "You haven't submitted any violation reports yet."}
              </p>
              {reports.length === 0 && (
                <button
                  onClick={() => setActiveTab("submit")}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
                  style={{ backgroundColor: accent }}
                >
                  Submit Your First Report
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report, index) => {
                const sConf = statusConfig[report.status] || statusConfig.Open;
                const isExpanded = expandedReport === report.id;

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 animate-fadeInUp"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Card Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() =>
                        setExpandedReport(isExpanded ? null : report.id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-800">
                                {report.violationType}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sConf.bg} ${sConf.text}`}
                              >
                                {sConf.icon}
                                {report.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Against:{" "}
                              <span className="font-medium text-gray-600">
                                {report.violatorId}
                              </span>
                              {report.auctionId && (
                                <>
                                  {" "}
                                  · Auction:{" "}
                                  <span className="font-medium text-gray-600">
                                    {report.auctionId}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 hidden sm:block">
                            {report.date}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 animate-slideDown">
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-start gap-2 mb-3">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-gray-500 mb-1">
                                Reason
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {report.reason}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                            <span>
                              Report ID:{" "}
                              <span className="font-mono text-gray-500">
                                {report.id}
                              </span>
                            </span>
                            <span className="sm:hidden">{report.date}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
