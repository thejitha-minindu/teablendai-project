"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  Truck,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Building,
  RefreshCw,
  AlertCircle,
  Package,
  Sparkles,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthClaims } from '@/lib/auth';
import { apiClient } from '@/lib/apiClient';
import { getOrderById, updatePaymentStatus, createCheckoutSession, type OrderDetail } from '@/services/orderService';

interface CheckoutProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default function OrderPaymentPage({ params }: CheckoutProps) {
  const resolvedParams = React.use(params);
  const orderId = resolvedParams.orderId;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Order Details
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error("Error fetching order for payment:", err);
      setError(err?.response?.data?.detail || err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);


  // Process Stripe Checkout
  const handleStripeCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await createCheckoutSession(orderId);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      toast.error(err?.response?.data?.detail || "Failed to initiate Stripe checkout. Try normal card payment.");
      setIsProcessing(false);
    }
  };

  // Calculation breakdown
  const subtotal = order ? (order.sold_price || order.total_amount || 0) : 0;
  const tax = subtotal * 0.10;
  const platformFee = subtotal * 0.02;
  const total = subtotal + tax + platformFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Loading Checkout</h3>
          <p className="text-sm text-slate-500">Securing payment connection...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h3>
          <p className="text-sm text-slate-600 mb-6">{error || "Unable to find the requested order."}</p>
          <button
            onClick={() => router.push('/buyer/orders')}
            className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3 rounded-xl transition-all"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  const isPaid = order.payment_status === "paid";

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-slate-600 hover:text-[#588157] font-semibold text-sm transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Back
          </button>

        </div>

        {/* Banner if already paid */}
        {isPaid && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-900 text-lg">Order Already Paid</h3>
                <p className="text-sm text-emerald-700">Payment for this order has already been successfully confirmed.</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push(`/orders/${orderId}`)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" /> Track Order
              </button>
              <button
                onClick={() => router.push(`/payment/success?orderId=${orderId}`)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-white border border-emerald-300 text-emerald-800 font-semibold rounded-xl text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" /> View Receipt
              </button>
            </div>
          </div>
        )}

        <div className="max-w-md mx-auto items-start space-y-8">
          
          <div className="text-center">
            <h1 className="text-3xl text-slate-900 font-black tracking-tight mb-2">Secure Checkout</h1>
            <p className="text-slate-500 text-sm">
              Complete payment for Order <span className="font-mono font-bold text-slate-800">{order.display_order_id || `#${order.order_id.slice(0, 8)}`}</span>
            </p>
          </div>

          {/* Order Summary & Logistics */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight flex items-center justify-between">
                <span>Order Summary</span>
                <Package className="w-5 h-5 text-slate-400" />
              </h3>

              {/* Lot Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <p className="font-bold text-slate-900 text-sm mb-1">{order.auction_name || "Tea Lot"}</p>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>Grade: <span className="font-semibold text-slate-800">{order.grade || "N/A"}</span></p>
                  <p>Quantity: <span className="font-semibold text-slate-800">{order.quantity || 0} kg</span></p>
                  <p>Seller: <span className="font-semibold text-slate-800">{order.seller_name || order.estate_name || "Verified Seller"}</span></p>
                </div>
              </div>
              
              {/* Financial Calculation */}
              <div className="space-y-3.5 text-sm mb-6">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono text-slate-800">
                    LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Tax (10%)</span>
                  <span className="font-mono text-slate-800">
                    LKR {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Platform Fee (2%)</span>
                  <span className="font-mono text-slate-800">
                    LKR {platformFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Total Amount</span>
                  <span className="text-2xl font-black text-[#344e41] leading-none">
                    LKR {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action / Status */}
              {isPaid ? (
                <div className="p-3 rounded-xl text-center text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✅ Payment Completed
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStripeCheckout}
                  disabled={isProcessing}
                  className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-900/10 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting to Stripe...
                    </>
                  ) : (
                    <>
                      Pay Now 
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>



            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-slate-400">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#588157]" /> SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#588157]" /> PCI-DSS Level 1
              </span>
            </div>

            {/* Back to Tracking Link */}
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#588157] py-2 transition-colors flex items-center justify-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> View Order Tracking & Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
