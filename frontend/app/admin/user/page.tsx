"use client";

import { useState, useEffect, ReactNode } from "react";
import { Eye, EyeOff, Pencil, User } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/api.config";


export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [admin, setAdmin] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // use a stable test id when page loads; replace with auth-derived id later
        const TEST_ADMIN_ID = process.env.NEXT_PUBLIC_TEST_ADMIN_ID || "A002";
        const res = await apiClient.get(`/admin/profile/${TEST_ADMIN_ID}`);
        const data = res.data || {};

        setAdmin({
          username: data.username || "",
          email: data.email || "",
          password: "", // never expose real password
          // support both snake_case and camelCase from backend
          firstName: data.firstName ?? data.first_name ?? "",
          lastName: data.lastName ?? data.last_name ?? "",
          joined: data.joined ?? data.joined_date ?? "",
          role: data.role || "",
          avatarUrl: data.avatarUrl || "/default-avatar.png",
        });
      } catch (err: any) {
        console.error("Fetch error:", err);
        const msg = err?.response?.data?.detail || err?.response?.data || err?.message || "Network error";
        setError(String(msg));

        // Provide a visible fallback demo profile so the page doesn't stay stuck on Loading
        // setAdmin({
        //   username: "admin_demo",
        //   email: "admin@example.com",
        //   password: "",
        //   firstName: "Demo",
        //   lastName: "Admin",
        //   joined: "2022-01-01",
        //   role: "Demo Administrator",
        //   avatarUrl: "/default-avatar.png",
        // });
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
      const idToUse = admin.admin_id ?? process.env.NEXT_PUBLIC_TEST_ADMIN_ID ?? "A002";
      await apiClient.put(`/admin/profile/${idToUse}`, {
        username: admin.username,
        email: admin.email,
        // send snake_case to match backend DB/update handlers
        first_name: admin.firstName,
        last_name: admin.lastName,
        role: admin.role,
      });

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile");
    }
  };

  /* ================= LOADING ================= */
  if (!admin) {
    return <div className="p-10">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border overflow-hidden">

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        ) : null}

        {/* ===== COVER ===== */}
        <div className="h-44 relative overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#14532d" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <rect width="1440" height="320" fill="url(#g1)" />
            <path
              d="M0,160 C240,220 480,100 720,128 C960,156 1200,260 1440,200 L1440,320 L0,320 Z"
              fill="#064e3b"
              opacity="0.2"
            />
          </svg>

          {/* Avatar */}
          <div className="absolute left-1/2 -bottom-14 -translate-x-1/2">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center">
                <User className="w-14 h-14 text-gray-400" />
              </div>
              <button className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow hover:bg-gray-50">
                <Pencil size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* ===== HEADER ===== */}
        <div className="pt-20 text-center">
          <h2 className="text-2xl font-semibold">
            {admin.firstName} {admin.lastName}
          </h2>
          <p className="text-sm text-gray-500">{admin.role}</p>
          <p className="text-xs text-gray-400 mt-1">
            Joined {admin.joined}
          </p>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="p-8">
          <h3 className="font-semibold mb-6">Account Details</h3>

          <div className="space-y-4">
            <Field label="Username">
              <input
                name="username"
                value={admin.username}
                disabled={!isEditing}
                onChange={handleChange}
                className={inputClass(isEditing)}
              />
            </Field>

            <Field label="Email">
              <input
                name="email"
                type="email"
                value={admin.email}
                disabled={!isEditing}
                onChange={handleChange}
                className={inputClass(isEditing)}
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={admin.password}
                  disabled={!isEditing}
                  onChange={handleChange}
                  className={inputClass(isEditing)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  disabled={!isEditing}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name">
                <input
                  name="firstName"
                  value={admin.firstName}
                  disabled={!isEditing}
                  onChange={handleChange}
                  className={inputClass(isEditing)}
                />
              </Field>

              <Field label="Last Name">
                <input
                  name="lastName"
                  value={admin.lastName}
                  disabled={!isEditing}
                  onChange={handleChange}
                  className={inputClass(isEditing)}
                />
              </Field>
            </div>
          </div>

          {/* ===== ACTIONS ===== */}
          <div className="flex justify-end gap-3 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border rounded-full text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-800 text-white rounded-full text-sm"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 border rounded-full text-sm flex items-center gap-2"
              >
                <Pencil size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputClass(enabled: boolean) {
  return `w-full border rounded-full px-4 py-2 text-sm
  ${
    enabled
      ? "bg-white border-gray-300 focus:border-green-600"
      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
  }`;
}