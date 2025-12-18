"use client";

import { useState } from "react";
import { Eye, EyeOff, Pencil, User } from "lucide-react";

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [admin, setAdmin] = useState({
    username: "admin_tea_master",
    email: "admin@teauction.com",
    password: "securePass123!",
    firstName: "Robert",
    lastName: "Chen",
    joined: "2022/05/15",
    role: "Senior Auction Administrator",
    avatarUrl: "/api/placeholder/112/112" // This will show a placeholder
  });

  const handleChange = (e) => {
    setAdmin({ ...admin, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border overflow-hidden">
        {/* COVER: decorative SVG background */}
        <div className="h-44 relative overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#14532d" stopOpacity="1" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect width="1440" height="320" fill="url(#g1)" />
            <path
              d="M0,160 C240,220 480,100 720,128 C960,156 1200,260 1440,200 L1440,320 L0,320 Z"
              fill="#064e3b"
              opacity="0.2"
            />
          </svg>
          <div className="absolute left-1/2 -bottom-14 -translate-x-1/2">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 overflow-hidden flex items-center justify-center">
                {/* Fallback to User icon if avatar doesn't load */}
                <User className="w-14 h-14 text-gray-400" />
              </div>
              <button className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow hover:bg-gray-50">
                <Pencil size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="pt-20 text-center">
          <h2 className="text-2xl font-semibold">{admin.firstName} {admin.lastName}</h2>
          <p className="text-sm text-gray-500">{admin.role}</p>
          <p className="text-xs text-gray-400 mt-1">Joined {admin.joined}</p>
        </div>

        {/* CONTENT */}
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={!isEditing}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Additional Info Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Admin ID</p>
                <p className="font-medium">ADMIN_20220515</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">2024-01-15 14:30:22</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Auctions Managed</p>
                <p className="font-medium">247</p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-full border text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-full bg-green-800 text-white text-sm hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-full border text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
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

/* ===== Helpers ===== */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputClass(enabled) {
  return `w-full border rounded-full px-4 py-2 text-sm outline-none transition-colors
    ${enabled
      ? "bg-white border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600" 
      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
    }`;
}