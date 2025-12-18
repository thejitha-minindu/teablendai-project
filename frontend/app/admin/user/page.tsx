"use client";

import { useState, ReactNode } from "react";
import { Eye, EyeOff, Pencil } from "lucide-react";

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [admin, setAdmin] = useState({
    username: "adminxxxxx",
    email: "example@gmail.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Fernando",
    joined: "2020/12/26",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                <img
                  src="/user-avatar.svg"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow">
                <Pencil size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="pt-20 text-center">
          <h2 className="text-2xl font-semibold">Admin xxxxxx</h2>
          <p className="text-sm text-gray-500">Joined {admin.joined}</p>
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
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

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

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-full border text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 rounded-full bg-green-800 text-white text-sm hover:bg-green-700"
                >
                  Save Edits
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 rounded-full border text-sm"
              >
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
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}

function inputClass(enabled: boolean) {
  return `w-full border rounded-full px-4 py-2 text-sm outline-none
    ${enabled ? "bg-white" : "bg-gray-100 text-gray-600"}`;
}
