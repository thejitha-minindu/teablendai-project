"use client";

import { useState, useEffect, ReactNode } from "react";
import { 
  Eye, 
  EyeOff, 
  Pencil, 
  User, 
  Mail, 
  Lock, 
  UserCheck, 
  Calendar, 
  Save, 
  X, 
  Shield,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/api.config";

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const TEST_ADMIN_ID = process.env.NEXT_PUBLIC_TEST_ADMIN_ID || "1";
        const res = await apiClient.get(`/admin/profile/${TEST_ADMIN_ID}`);
        const data = res.data || {};

        setAdmin({
          admin_id: data.admin_id || TEST_ADMIN_ID,
          username: data.username || "",
          email: data.email || "",
          password: "", // never expose real password
          firstName: data.firstName ?? data.first_name ?? "",
          lastName: data.lastName ?? data.last_name ?? "",
          joined: data.joined ?? data.joined_date ?? "",
          role: data.role || "Administrator",
          avatarUrl: data.avatarUrl || null,
          lastLogin: data.last_login || "2024-01-15 10:30 AM",
          totalActions: data.total_actions || 247,
          status: data.status || "active"
        });
        setError(null);
      } catch (err: any) {
        console.error("Fetch error:", err);
        const msg = err?.response?.data?.detail || err?.response?.data || err?.message || "Network error";
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdmin({ ...admin, [e.target.name]: e.target.value });
  };

  /* ================= SAVE DATA ================= */
  const handleSave = async () => {
    try {
      setLoading(true);
      const idToUse = admin.admin_id ?? process.env.NEXT_PUBLIC_TEST_ADMIN_ID ?? "138A593A-0DC7-4DF9-9E2A-B798983C939D";
      await apiClient.put(`/admin/profile/${idToUse}`, {
        username: admin.username,
        email: admin.email,
        first_name: admin.firstName,
        last_name: admin.lastName,
        role: admin.role,
      });

      setIsEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Update failed:", error);
      setError("Failed to update profile");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload original data
    window.location.reload();
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Notifications */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 animate-slideDown">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 animate-slideDown">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Image with Gradient */}
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-800 to-emerald-900">
              <svg
                className="absolute inset-0 w-full h-full opacity-20"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,96 C240,160 480,32 720,64 C960,96 1200,224 1440,160 L1440,320 L0,320 Z"
                  fill="white"
                />
              </svg>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                admin.status === "active" 
                  ? "bg-green-500 text-white" 
                  : "bg-gray-500 text-white"
              }`}>
                <div className={`w-2 h-2 rounded-full ${admin.status === "active" ? "bg-white animate-pulse" : "bg-gray-300"}`}></div>
                {admin.status === "active" ? "Active" : "Inactive"}
              </div>
            </div>

            {/* Avatar */}
            <div className="absolute left-1/2 -bottom-16 -translate-x-1/2">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-lg">
                  {admin.avatarUrl ? (
                    <img src={admin.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-green-700" />
                  )}
                </div>
                <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <Camera size={14} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div className="pt-20 pb-6 text-center border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800">
              {admin.firstName} {admin.lastName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Shield className="w-4 h-4 text-green-600" />
              <p className="text-sm text-gray-500">{admin.role}</p>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {new Date(admin.joined).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last login: {admin.lastLogin}
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{admin.totalActions}</p>
              <p className="text-xs text-gray-500">Actions Performed</p>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <p className="text-2xl font-bold text-green-700">
                {new Date(admin.joined).getFullYear()}
              </p>
              <p className="text-xs text-gray-500">Member Since</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {admin.status === "active" ? "✓" : "•"}
              </p>
              <p className="text-xs text-gray-500">Account Status</p>
            </div>
          </div>

          {/* Account Details Form */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Account Details
              </h3>
              {!isEditing && (
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Administrator Access
                </div>
              )}
            </div>

            <div className="space-y-5">
              {/* Username */}
              <Field label="Username" icon={<User className="w-4 h-4" />}>
                <input
                  name="username"
                  value={admin.username}
                  disabled={!isEditing}
                  onChange={handleChange}
                  className={inputClass(isEditing)}
                  placeholder="Enter username"
                />
              </Field>

              {/* Email */}
              <Field label="Email Address" icon={<Mail className="w-4 h-4" />}>
                <input
                  name="email"
                  type="email"
                  value={admin.email}
                  disabled={!isEditing}
                  onChange={handleChange}
                  className={inputClass(isEditing)}
                  placeholder="Enter email address"
                />
              </Field>

              {/* Password */}
              <Field label="Password" icon={<Lock className="w-4 h-4" />}>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={admin.password}
                    disabled={!isEditing}
                    onChange={handleChange}
                    className={inputClass(isEditing)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={!isEditing}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-400 mt-1">
                    Leave blank to keep current password
                  </p>
                )}
              </Field>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name">
                  <input
                    name="firstName"
                    value={admin.firstName}
                    disabled={!isEditing}
                    onChange={handleChange}
                    className={inputClass(isEditing)}
                    placeholder="First name"
                  />
                </Field>

                <Field label="Last Name">
                  <input
                    name="lastName"
                    value={admin.lastName}
                    disabled={!isEditing}
                    onChange={handleChange}
                    className={inputClass(isEditing)}
                    placeholder="Last name"
                  />
                </Field>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg text-sm font-medium hover:from-green-800 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 border-2 border-green-600 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-all duration-200 flex items-center gap-2"
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" />
            Account Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Admin ID:</span>
              <span className="font-mono text-gray-800">{admin.admin_id}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Role Level:</span>
              <span className="text-green-700 font-medium">{admin.role}</span>
            </div>
          </div>
        </div>
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

/* ===== FIELD COMPONENT ===== */
function Field({ label, children, icon }: { label: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <div className="flex items-center gap-2">
          {icon}
          {label}
        </div>
      </label>
      {children}
    </div>
  );
}

function inputClass(enabled: boolean) {
  return `w-full border rounded-lg px-4 py-2.5 text-sm transition-all duration-200
  ${
    enabled
      ? "bg-white border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
      : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
  }`;
}