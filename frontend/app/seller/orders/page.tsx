"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Search, CheckCircle, Clock, Truck, AlertCircle,
  ChevronDown, RefreshCw, MessageCircle, Eye, Flag
} from "lucide-react";
import { getSellerOrders, updateOrderStatus, type OrderDetail } from "@/services/orderService";

const STATUS_FLOW = [
  "pending", "confirmed", "processing", "packed",
  "shipped", "out_for_delivery", "delivered"
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:          { label: "Pending",          color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: <Clock className="w-4 h-4" /> },
  confirmed:        { label: "Confirmed",        color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <CheckCircle className="w-4 h-4" /> },
  processing:       { label: "Processing",       color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: <RefreshCw className="w-4 h-4" /> },
  packed:           { label: "Packed",           color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <Package className="w-4 h-4" /> },
  shipped:          { label: "Shipped",          color: "text-sky-700",    bg: "bg-sky-50 border-sky-200",       icon: <Truck className="w-4 h-4" /> },
  out_for_delivery: { label: "Out for Delivery", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <Truck className="w-4 h-4" /> },
  delivered:        { label: "Delivered",        color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle className="w-4 h-4" /> },
  canceled:         { label: "Cancelled",        color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: <AlertCircle className="w-4 h-4" /> },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Awaiting Payment", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  paid:    { label: "Paid",             color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  failed:  { label: "Failed",           color: "text-red-700",    bg: "bg-red-50 border-red-200" },
};

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getSellerOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch seller orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Poll every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.order_id === orderId ? updated : o));
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update order status. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  // Filter and search
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      !searchQuery ||
      (o.display_order_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.buyer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.auction_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" || o.order_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === "pending").length,
    processing: orders.filter(o => ["confirmed", "processing", "packed"].includes(o.order_status)).length,
    shipped: orders.filter(o => ["shipped", "out_for_delivery"].includes(o.order_status)).length,
    delivered: orders.filter(o => o.order_status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#588157] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h1>
        <p className="text-gray-500 mt-1">Manage and track all your buyer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Orders", value: stats.total, color: "bg-gray-50 border-gray-200 text-gray-700" },
          { label: "Pending", value: stats.pending, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { label: "Processing", value: stats.processing, color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
          { label: "Shipped", value: stats.shipped, color: "bg-sky-50 border-sky-200 text-sky-700" },
          { label: "Delivered", value: stats.delivered, color: "bg-green-50 border-green-200 text-green-700" },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl border ${stat.color}`}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID, buyer name, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157] outline-none transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157] outline-none"
        >
          <option value="all">All Statuses</option>
          {STATUS_FLOW.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
          ))}
          <option value="canceled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">Orders from your auctions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;
            const paymentCfg = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.pending;
            const nextStatus = getNextStatus(order.order_status);
            const isExpanded = expandedOrderId === order.order_id;
            const isPaid = order.payment_status === "paid";
            const isUpdating = updatingOrderId === order.order_id;

            return (
              <div key={order.order_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Main Row */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.order_id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-[#E5F7CB] p-3 rounded-xl">
                        <Package className="w-6 h-6 text-[#3A5A40]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{order.auction_name || "Tea Lot"}</h3>
                          <span className="text-xs text-gray-400 font-mono">{order.display_order_id || order.order_id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Buyer: <span className="font-medium text-gray-700">{order.buyer_name || "Unknown"}</span>
                          {order.quantity && <> · {order.quantity} kg</>}
                          {order.grade && <> · Grade {order.grade}</>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Payment Badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${paymentCfg.bg} ${paymentCfg.color}`}>
                        {paymentCfg.label}
                      </span>
                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {/* Price */}
                      <span className="font-bold text-[#344e41] text-lg min-w-[100px] text-right">
                        LKR {(order.sold_price || order.total_amount || 0).toLocaleString()}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Order Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Order Details</h4>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-gray-500">Order ID:</span> <span className="font-medium text-gray-800 font-mono">{order.display_order_id || order.order_id.slice(0, 8)}</span></p>
                          <p><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}</span></p>
                          <p><span className="text-gray-500">Estate:</span> <span className="font-medium text-gray-800">{order.estate_name || "N/A"}</span></p>
                          <p><span className="text-gray-500">Amount:</span> <span className="font-bold text-[#344e41]">LKR {(order.sold_price || order.total_amount || 0).toLocaleString()}</span></p>
                        </div>
                      </div>

                      {/* Buyer Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Buyer Info</h4>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{order.buyer_name || "N/A"}</span></p>
                          <p><span className="text-gray-500">Payment:</span> <span className={`font-bold ${paymentCfg.color}`}>{paymentCfg.label}</span></p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Actions</h4>

                        {/* Next Status Button */}
                        {nextStatus && isPaid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(order.order_id, nextStatus); }}
                            disabled={isUpdating}
                            className="w-full bg-[#3A5A40] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2A402E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isUpdating ? (
                              <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</>
                            ) : (
                              <>Mark as {STATUS_CONFIG[nextStatus]?.label || nextStatus}</>
                            )}
                          </button>
                        )}

                        {/* Disabled message if not paid */}
                        {nextStatus && !isPaid && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                            <p className="text-xs font-medium text-yellow-700">
                              ⏳ Awaiting buyer payment before status can be updated
                            </p>
                          </div>
                        )}

                        {/* Delivered message */}
                        {!nextStatus && order.order_status === "delivered" && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-xs font-bold text-green-700">✅ Order Delivered Successfully</p>
                          </div>
                        )}

                        {/* View, Chat & Report buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.order_id}`); }}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/messages/${order.order_id}`); }}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                          >
                            <MessageCircle className="w-4 h-4" /> Chat
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/seller/violations?violatorId=${order.buyer_id}&auctionId=${order.auction_id}`); }}
                            className="flex-1 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl font-medium text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                            title="Report User"
                          >
                            <Flag className="w-4 h-4" /> Report
                          </button>
                        </div>
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
  );
}
