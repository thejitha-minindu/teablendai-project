"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Search, CheckCircle, Clock, Truck, AlertCircle,
  ChevronDown, RefreshCw, MessageCircle, Eye, Flag, CreditCard
} from "lucide-react";
import { getBuyerOrders, type OrderDetail } from "@/services/orderService";
import { toast } from 'sonner';

const STATUS_FLOW = [
  "pending", "confirmed", "processing", "packed",
  "shipped", "out_for_delivery", "delivered"
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon?: React.ReactNode }> = {
  pending:          { label: "Pending",          color: "text-gray-700", bg: "bg-white border-gray-200" },
  confirmed:        { label: "Confirmed",        color: "text-gray-700", bg: "bg-white border-gray-200" },
  processing:       { label: "Processing",       color: "text-gray-700", bg: "bg-white border-gray-200", icon: <RefreshCw className="w-4 h-4" /> },
  packed:           { label: "Packed",           color: "text-gray-700", bg: "bg-white border-gray-200", icon: <Package className="w-4 h-4" /> },
  shipped:          { label: "Shipped",          color: "text-gray-700", bg: "bg-white border-gray-200", icon: <Truck className="w-4 h-4" /> },
  out_for_delivery: { label: "Out for Delivery", color: "text-gray-700", bg: "bg-white border-gray-200", icon: <Truck className="w-4 h-4" /> },
  delivered:        { label: "Delivered",        color: "text-gray-700", bg: "bg-white border-gray-200", icon: <CheckCircle className="w-4 h-4" /> },
  canceled:         { label: "Cancelled",        color: "text-gray-700", bg: "bg-white border-gray-200", icon: <AlertCircle className="w-4 h-4" /> },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Awaiting Payment", color: "text-gray-700", bg: "bg-white border-gray-200" },
  paid:    { label: "Paid",             color: "text-gray-700", bg: "bg-white border-gray-200" },
  failed:  { label: "Failed",           color: "text-gray-700", bg: "bg-white border-gray-200" },
};

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getBuyerOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch buyer orders:", err);
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

  // Filter and search
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      !searchQuery ||
      (o.display_order_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.seller_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          <RefreshCw className="w-8 h-8 text-gray-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:px-4 lg:px-10 lg:pt-10 mb-10">
      {/* Header */}
      <div className="mb-5 items-start">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-2">Track and manage all your purchases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Orders", value: stats.total, color: "bg-white border-gray-200 text-gray-700" },
          { label: "Pending", value: stats.pending, color: "bg-white border-gray-200 text-gray-700" },
          { label: "Processing", value: stats.processing, color: "bg-white border-gray-200 text-gray-700" },
          { label: "Shipped", value: stats.shipped, color: "bg-white border-gray-200 text-gray-700" },
          { label: "Delivered", value: stats.delivered, color: "bg-white border-gray-200 text-gray-700" },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-2xl border flex flex-col gap-3 ${stat.color}`}>
            <div className="flex items-center">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <span className="text-3xl font-semibold">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID, seller name, or product..."
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
          <p className="text-gray-400 text-sm mt-1">Your won auctions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;
            const paymentCfg = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.pending;
            const isExpanded = expandedOrderId === order.order_id;
            const isPaid = order.payment_status === "paid";

            return (
              <div key={order.order_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Main Row */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.order_id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                        <Package className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900 line-clamp-1">{order.auction_name || "N/A"}</span>
                          <span className="text-xs text-gray-400 font-mono">{order.display_order_id || order.order_id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Seller: <span className="font-medium text-gray-700">{order.seller_name || "Unknown"}</span>
                          {order.quantity && <> · {order.quantity} kg</>}
                          {order.grade && <> · Grade {order.grade}</>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Payment Badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${paymentCfg.bg} ${paymentCfg.color}`}>
                        {paymentCfg.label}
                      </span>
                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {/* Price */}
                      <span className="font-semibold text-gray-900 text-lg min-w-[100px] text-right">
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
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Details</h4>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-gray-500">Order ID:</span> <span className="font-medium text-gray-800 font-mono">{order.display_order_id || order.order_id.slice(0, 8)}</span></p>
                          <p><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-800">{order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}</span></p>
                          <p><span className="text-gray-500">Estate:</span> <span className="font-medium text-gray-800">{order.estate_name || "N/A"}</span></p>
                          <p><span className="text-gray-500">Amount:</span> <span className="font-semibold text-gray-900">LKR {(order.sold_price || order.total_amount || 0).toLocaleString()}</span></p>
                        </div>
                      </div>

                      {/* Seller Info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Seller Info</h4>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-800">{order.seller_name || "N/A"}</span></p>
                          <p><span className="text-gray-500">Payment:</span> <span className={`font-semibold ${paymentCfg.color}`}>{paymentCfg.label}</span></p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</h4>

                        {/* Pay Now Button */}
                        {!isPaid && (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/payment?orderId=${order.order_id}`); }}
                            className="w-full bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" /> Pay Now
                          </button>
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
                            onClick={(e) => { e.stopPropagation(); router.push(`/buyer/violations?violatorId=${order.seller_id}&auctionId=${order.auction_id}`); }}
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
