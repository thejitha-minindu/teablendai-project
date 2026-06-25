"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Truck, CreditCard, Package, Clock, MapPin,
  ArrowLeft, ShieldCheck, User, MessageCircle, RefreshCw
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthClaims } from "@/lib/auth";
import { getOrderById, updateOrderStatus, createCheckoutSession, type OrderDetail } from "@/services/orderService";
import { toast } from 'sonner';

interface OrderTrackingPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed",       icon: Package,     description: "Order has been placed and is awaiting payment." },
  { key: "paid",             label: "Payment Received",   icon: CreditCard,  description: "Payment confirmed. Seller notified." },
  { key: "confirmed",        label: "Order Confirmed",    icon: CheckCircle, description: "Seller has confirmed the order." },
  { key: "processing",       label: "Processing",         icon: RefreshCw,   description: "Order is being prepared." },
  { key: "packed",           label: "Packed",             icon: Package,     description: "Tea lot has been packed for shipping." },
  { key: "shipped",          label: "Shipped",            icon: Truck,       description: "Order is on the way." },
  { key: "out_for_delivery", label: "Out for Delivery",   icon: Truck,       description: "Delivery is in progress." },
  { key: "delivered",        label: "Delivered",           icon: MapPin,      description: "Order has been delivered successfully!" },
];

function getStepIndex(orderStatus: string, paymentStatus: string): number {
  // If not paid, we're at step 0 (pending)
  if (paymentStatus !== "paid") return 0;
  // If paid, find the order_status in the remaining steps
  const statusMap: Record<string, number> = {
    pending: 1,    // paid but order still pending
    confirmed: 2,
    processing: 3,
    packed: 4,
    shipped: 5,
    out_for_delivery: 6,
    delivered: 7,
  };
  return statusMap[orderStatus] ?? 1;
}

export default function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUserRole, setCurrentUserRole] = useState<'SELLER' | 'BUYER' | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const orderId = resolvedParams.orderId;

  const fetchOrder = useCallback(async () => {
    try {
      const claims = getAuthClaims();
      if (!claims?.id) return;

      const orderData = await getOrderById(orderId);
      setOrder(orderData);

      // Determine role — use JWT role claim as primary source
      const jwtRole = claims.role; // "buyer" or "seller" from JWT
      const uid = claims.id.toLowerCase();
      const isSeller = orderData.seller_id?.toLowerCase() === uid;
      const isBuyer = orderData.buyer_id?.toLowerCase() === uid;
      
      // Use JWT role if user is both buyer and seller of this order (unlikely but safe)
      // Otherwise use ID match, with JWT role as ultimate fallback
      if (isSeller) {
        setCurrentUserRole('SELLER');
      } else if (isBuyer) {
        setCurrentUserRole('BUYER');
      } else {
        // Fallback to JWT role claim
        setCurrentUserRole(jwtRole === 'seller' ? 'SELLER' : 'BUYER');
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      if (!order) {
        setError(err.message || "Failed to load order details");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  // --- ACTIONS ---
  const handlePayment = async () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    try {
      const res = await createCheckoutSession(orderId);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      toast.error("Failed to initiate payment. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    toast(`Update order status to "${newStatus}"?`, {
      action: {
        label: 'Confirm',
        onClick: async () => {
          setIsUpdating(true);
          try {
            const updated = await updateOrderStatus(orderId, newStatus);
            setOrder(updated);
            toast.success("Status updated successfully.");
          } catch (err) {
            console.error("Status update failed:", err);
            toast.error("Failed to update status. Please try again.");
          } finally {
            setIsUpdating(false);
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  // --- UI HELPERS ---
  const currentStepIndex = order ? getStepIndex(order.order_status, order.payment_status) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#588157] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600 font-medium">No order found</p>
      </div>
    );
  }

  const isPaid = order.payment_status === "paid";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>

        {/* --- ORDER CARD --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Order {order.display_order_id || `#${order.order_id.slice(0, 8)}`}
              </h1>
              <p className="text-gray-500 text-sm">Placed on {order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className="flex gap-2 items-start">
              {/* Payment Status Badge */}
              <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {isPaid ? '✅ Paid' : '⏳ Awaiting Payment'}
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Item Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Item Details</h3>
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-3 rounded-xl">
                  <Package className="w-8 h-8 text-[#588157]" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">{order.auction_name || "Tea Lot"}</h2>
                  <p className="text-gray-600">Grade: <span className="font-medium text-gray-900">{order.grade || "N/A"}</span></p>
                  <p className="text-gray-600">Quantity: <span className="font-medium text-gray-900">{order.quantity || 0} kg</span></p>
                  <p className="text-gray-600">Total: <span className="font-bold text-[#588157] text-lg">LKR {(order.sold_price || order.total_amount || 0).toLocaleString()}</span></p>
                </div>
              </div>
            </div>

            {/* Counterparty Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">
                {currentUserRole === 'BUYER' ? 'Seller Info' : 'Buyer Info'}
              </h3>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {currentUserRole === 'BUYER' ? (order.seller_name || order.estate_name || "Seller") : (order.buyer_name || "Buyer")}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verified Account
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/messages/${orderId}`)}
                  className="w-full bg-[#588157] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-[#3A5A40] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact {currentUserRole === 'BUYER' ? 'Seller' : 'Buyer'}
                </button>
              </div>
            </div>
          </div>

          {/* Buyer Pay Now Button */}
          {currentUserRole === 'BUYER' && !isPaid && (
            <div className="px-6 pb-6">
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="w-full bg-[#588157] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#3A5A40] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <><RefreshCw className="w-6 h-6 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-6 h-6" /> Pay Now — LKR {(order.sold_price || order.total_amount || 0).toLocaleString()}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* --- ORDER TIMELINE --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#588157]" />
            Order Progress
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200" />

            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isPending = idx > currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="relative flex gap-6 mb-8 last:mb-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 border-4 transition-all bg-white ${
                    isCompleted ? 'bg-green-50 border-green-500 text-green-600' :
                    isCurrent ? 'border-[#588157] text-[#588157] shadow-lg ring-4 ring-[#588157]/10' :
                    'border-gray-200 text-gray-300'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="pt-2 flex-1">
                    <h3 className={`font-bold ${isPending ? 'text-gray-400' : isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                      {step.label}
                    </h3>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {isCurrent ? step.description : isCompleted ? "Completed" : "Upcoming"}
                    </p>

                    {/* Seller action buttons at current step */}
                    {currentUserRole === 'SELLER' && isCurrent && isPaid && idx >= 1 && idx < STATUS_STEPS.length - 1 && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleStatusUpdate(STATUS_STEPS[idx + 1]?.key || "")}
                          disabled={isUpdating || !STATUS_STEPS[idx + 1]}
                          className="bg-[#3A5A40] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#2A402E] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isUpdating ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</>
                          ) : (
                            <>Mark as {STATUS_STEPS[idx + 1]?.label || "Next"}</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Seller disabled message if not paid */}
                    {currentUserRole === 'SELLER' && isCurrent && !isPaid && idx === 0 && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                        <p className="text-xs font-medium text-yellow-700">
                          ⏳ Waiting for buyer payment before you can process this order
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
}
