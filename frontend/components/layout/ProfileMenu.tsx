"use client";
import { useState, useEffect } from "react";
import { User, HelpCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export function ProfileMenu({
  isOpen,
  onClose,
  isCollapsed,
}: ProfileMenuProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("Loading...");
  const [userName, setUserName] = useState("User");

  // Decode JWT on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("teablend_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const email = payload.sub;
          setUserEmail(email);
          const firstName = payload.first_name || '';
          const lastName = payload.last_name || '';
          if (firstName || lastName) {
            setUserName(`${firstName} ${lastName}`.trim());
          } else {
            const namePart = email.split('@')[0];
            setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
          }
        } catch (e) {
          console.error("Failed to decode token", e);
        }
      }
    }
  }, [isOpen]); // Re-check when opened

  const handleLogout = () => {
    onClose();
    if (typeof window !== "undefined") {
      localStorage.removeItem("teablend_token");
      localStorage.removeItem("role");
      window.location.href = "/auth";
    }
  };

  const handleProfileClick = () => {
    onClose();
    router.push("/auth/profile");
  };

  if (!isOpen || isCollapsed) return null;

  return (
    <div className="width-50 absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Profile Info */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#558332] flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Profile</span>
        </button>

        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Help & Support</span>
        </button>
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
