"use client";

import { useEffect, useState } from "react";
import { Loader2, UserCheck, UserX, RefreshCw, ShieldCheck, ShieldAlert, Calendar, Mail, User } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

export default function AdminVerificationPage() {
  const { user: currentUser, loading: authLoading } = useUser();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; type: "approve" | "reject" } | null>(null);

  const fetchPendingAdmins = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiClient.get("/admin/users/admins/pending");
      setAdmins(response.data.admins || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load pending admins");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "superadmin") {
      fetchPendingAdmins();
    }
  }, [currentUser]);

  const handleApprove = async (id: string, name: string) => {
    try {
      setProcessingId(id);
      await apiClient.put(`/admin/users/admins/approve/${id}`);
      toast.success(`Admin ${name} approved successfully!`);
      setAdmins((prev) => prev.filter((a) => a.admin_id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to approve admin");
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      setProcessingId(id);
      await apiClient.delete(`/admin/users/admins/reject/${id}`);
      toast.warning(`Admin registration request for ${name} rejected.`);
      setAdmins((prev) => prev.filter((a) => a.admin_id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reject admin");
    } finally {
      setProcessingId(null);
      setConfirmAction(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
        <p className="text-gray-500 text-lg">Authenticating admin session...</p>
      </div>
    );
  }

  // Check if current user has superadmin role
  if (currentUser?.role !== "superadmin") {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md shadow-lg shadow-red-100/50">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            Only accounts with <strong>superadmin</strong> privileges can access this panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-slideUp border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              {confirmAction.type === "approve" ? (
                <>
                  <UserCheck className="w-6 h-6 text-green-600" />
                  Approve Administrator Request
                </>
              ) : (
                <>
                  <UserX className="w-6 h-6 text-red-600" />
                  Reject Administrator Request
                </>
              )}
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Are you sure you want to {confirmAction.type === "approve" ? "approve" : "reject"} the admin registration request for{" "}
              <strong>{confirmAction.name}</strong>?
              {confirmAction.type === "reject" && " This action will delete the request and cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction.type === "approve"
                    ? handleApprove(confirmAction.id, confirmAction.name)
                    : handleReject(confirmAction.id, confirmAction.name)
                }
                disabled={processingId !== null}
                className={`px-5 py-2 text-sm rounded-xl transition-all font-semibold flex items-center gap-2 text-white shadow-md hover:shadow-lg disabled:opacity-50 ${
                  confirmAction.type === "approve"
                    ? "bg-green-600 hover:bg-green-700 shadow-green-100"
                    : "bg-red-600 hover:bg-red-700 shadow-red-100"
                }`}
              >
                {processingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm {confirmAction.type === "approve" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            Admin Verification
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {admins.length} registration request{admins.length === 1 ? "" : "s"} pending review
          </p>
        </div>

        <button
          onClick={() => fetchPendingAdmins(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 bg-gray-50/50 rounded-2xl border border-dashed">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          <p className="text-gray-500 text-sm">Loading requests...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
            <p className="text-red-600 mb-4 text-sm font-medium">{error}</p>
            <button
              onClick={() => fetchPendingAdmins()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-gray-50/60 border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">All Admins Verified</h3>
          <p className="text-gray-450 mt-2 text-sm">
            There are no pending admin registration requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map((admin) => (
            <div
              key={admin.admin_id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-gray-100/80 border-l-4 border-l-purple-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {admin.email}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      @{admin.username}
                    </span>
                    {admin.joined_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Requested: {admin.joined_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  onClick={() =>
                    setConfirmAction({
                      id: admin.admin_id,
                      name: `${admin.first_name} ${admin.last_name}`,
                      type: "reject",
                    })
                  }
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all duration-205 flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() =>
                    setConfirmAction({
                      id: admin.admin_id,
                      name: `${admin.first_name} ${admin.last_name}`,
                      type: "approve",
                    })
                  }
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all duration-205 flex items-center gap-1.5 shadow-md shadow-green-100 hover:shadow-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
