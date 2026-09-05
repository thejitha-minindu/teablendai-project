"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  BellOff,
  ShoppingBag,
  AlertCircle,
  Tag,
  CheckCircle2,
  X,
  Loader2,
  Filter,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { getStoredToken } from "@/lib/auth";

export type NotificationItem = {
  notification_id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: "order" | "system" | "promo" | "alert" | string;
  is_read: boolean;
  created_at: string;
};

function formatRelativeTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

interface NotificationBellProps {
  className?: string;
  iconClassName?: string;
}

export function NotificationBell({ className = "", iconClassName = "" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const modalRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const res = await apiClient.get<NotificationItem[]>("/notifications/me");
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error("[NotificationBell] Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + periodic polling every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
    if (isRead) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    );

    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (err) {
      console.error("[NotificationBell] Failed to mark notification as read:", err);
      // Rollback on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: false } : n
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await apiClient.patch("/notifications/mark-all-read");
    } catch (err) {
      console.error("[NotificationBell] Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-purple-600" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "promo":
        return <Tag className="h-4 w-4 text-amber-600" />;
      case "system":
      default:
        return <Bell className="h-4 w-4 text-[#3A5A40]" />;
    }
  };

  const getNotificationBg = (type: string, isRead: boolean) => {
    if (isRead) return "bg-gray-100";
    switch (type) {
      case "order":
        return "bg-purple-100";
      case "alert":
        return "bg-red-100";
      case "promo":
        return "bg-amber-100";
      case "system":
      default:
        return "bg-[#E5F7CB]";
    }
  };

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || !n.is_read
  );

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        className={`relative p-2.5 rounded-full bg-white text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-[#3A5A40] hover:text-[#3A5A40] transition-all focus:outline-none focus:ring-2 focus:ring-[#3A5A40]/30 ${className}`}
      >
        <Bell className={`h-5 w-5 transition-transform group-hover:scale-105 ${iconClassName}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Modal Backdrop & Popup Menu */}
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div
              ref={modalRef}
              className="pointer-events-auto relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-[#F5F7EB] to-emerald-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#3A5A40] text-white">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Notifications</h2>
                    <p className="text-xs text-gray-500">
                      {unreadCount > 0
                        ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                        : "You're all caught up"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subheader: Filter & Mark all read */}
              <div className="flex items-center justify-between px-6 py-2.5 bg-gray-50/70 border-b border-gray-100 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      filter === "all"
                        ? "bg-white text-[#3A5A40] shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("unread")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      filter === "unread"
                        ? "bg-white text-[#3A5A40] shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="inline-flex items-center gap-1 font-semibold text-[#3A5A40] hover:text-[#2A402E] transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3A5A40]" />
                    <span className="text-xs font-medium">Loading notifications...</span>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-14 text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                      <BellOff className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      {filter === "unread"
                        ? "You've read all your notifications."
                        : "We'll notify you here when auctions, orders, or system events update."}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => (
                    <div
                      key={n.notification_id}
                      onClick={() => handleMarkAsRead(n.notification_id, n.is_read)}
                      className={`p-4 transition-all cursor-pointer flex gap-3 items-start group ${
                        !n.is_read
                          ? "bg-[#F5F7EB]/40 hover:bg-[#F5F7EB]/80"
                          : "bg-white hover:bg-gray-50 opacity-80"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center ${getNotificationBg(
                            n.type,
                            n.is_read
                          )}`}
                        >
                          {getNotificationIcon(n.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-tight ${
                              !n.is_read
                                ? "font-bold text-gray-900 group-hover:text-[#3A5A40]"
                                : "font-medium text-gray-700"
                            }`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 font-medium whitespace-nowrap">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      </div>

                      {!n.is_read && (
                        <div className="shrink-0 w-2 h-2 mt-2 rounded-full bg-[#3A5A40]" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-6">
                <span>{notifications.length} total notification{notifications.length !== 1 ? "s" : ""}</span>
                <Link
                  href="/auth/profile"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 font-semibold text-[#3A5A40] hover:underline"
                >
                  Manage Profile
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
