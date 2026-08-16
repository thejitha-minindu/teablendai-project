"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle, ArrowRight, Download, Package, Truck,
  ShieldCheck, RefreshCw
} from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [showContent, setShowContent] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 200);

    const verifyPayment = async () => {
      if (orderId) {
        try {
          const { apiClient } = await import('@/lib/apiClient');
          const verifyRes = await apiClient.get(`/payment/verify/${orderId}`);
          if (verifyRes.data?.payment_status === 'paid' || verifyRes.data?.status === 'success') {
            setVerified(true);
          }
          const orderRes = await apiClient.get(`/orders/${orderId}`);
          setOrder(orderRes.data);
        } catch (error) {
          console.error("Failed to verify payment status:", error);
          try {
            const { apiClient } = await import('@/lib/apiClient');
            const orderRes = await apiClient.get(`/orders/${orderId}`);
            setOrder(orderRes.data);
            if (orderRes.data?.payment_status === 'paid') setVerified(true);
          } catch { }
        } finally {
          setVerifying(false);
        }
      } else {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  const txnId = orderId ? `TXN-${orderId.slice(0, 8).toUpperCase()}` : 'TXN-UNKNOWN';
  const subtotal = order?.total_amount || order?.sold_price || 0;
  const tax = subtotal * 0.1;
  const platformFee = subtotal * 0.02;
  const totalPaid = subtotal + tax + platformFee;

  const handlePrint = () => { window.print(); };

  return (
    <>
      {/* ───── Screen UI (hidden when printing) ───── */}
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-4 print:hidden">
        <div
          className={`bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden transition-all duration-700 transform ${
            showContent ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
          }`}
        >
          {/* ── Green header ── */}
          <div className="bg-gradient-to-br from-[#588157] to-[#3A5A40] px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.12)_0%,transparent_60%)]" />
            <div className="relative z-10">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-1000 ${
                  showContent ? 'scale-100' : 'scale-0'
                }`}
              >
                {verifying ? (
                  <RefreshCw className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-spin" />
                ) : (
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
                {verifying ? 'Verifying Payment…' : 'Payment Successful!'}
              </h1>
              <p className="text-green-100 text-xs sm:text-sm max-w-[260px] mx-auto leading-snug">
                {verifying
                  ? 'Confirming your payment with Stripe…'
                  : 'Thank you — the seller has been notified.'}
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            {/* Transaction summary */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 mb-4 border border-gray-100 text-[13px] sm:text-sm">
              {/* IDs */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Txn&nbsp;ID</span>
                <span className="font-mono font-bold text-gray-700 text-xs sm:text-sm">{txnId}</span>
              </div>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Order</span>
                <span className="font-mono font-bold text-gray-700 text-xs sm:text-sm">
                  {order?.display_order_id || (orderId ? `#${orderId.slice(0, 8)}` : 'N/A')}
                </span>
              </div>

              {/* Amounts (only when data is loaded) */}
              {subtotal > 0 && (
                <>
                  <div className="flex justify-between items-center py-0.5 text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-mono">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-gray-500">
                    <span>Tax (10%)</span>
                    <span className="font-mono">LKR {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 text-gray-500">
                    <span>Platform Fee (2%)</span>
                    <span className="font-mono">LKR {platformFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                    <span className="font-black text-gray-900 text-xs uppercase tracking-wider">Total Paid</span>
                    <span className="font-black text-[#344e41] text-base sm:text-lg">
                      LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Escrow badge */}
            {!verifying && verified && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2.5 mb-4 text-xs text-green-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                Payment verified &amp; secured in escrow.
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => orderId ? router.push(`/orders/${orderId}`) : null}
                disabled={!orderId || verifying}
                className={`w-full ${
                  orderId && !verifying
                    ? 'bg-[#588157] hover:bg-[#3A5A40] shadow-md shadow-green-900/10'
                    : 'bg-gray-200 cursor-not-allowed'
                } text-white font-bold py-2.5 sm:py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                  !orderId || verifying ? 'opacity-60' : ''
                }`}
              >
                {verifying ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
                ) : (
                  <><Truck className="w-4 h-4" /> Track Order <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>

              <button
                onClick={handlePrint}
                disabled={!order}
                className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-2.5 sm:py-3 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Download Receipt
              </button>

              <button
                type="button"
                onClick={() => router.push('/buyer/orders')}
                className="w-full text-gray-400 font-medium py-1.5 text-xs hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
              >
                <Package className="w-3 h-3" /> View All Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Printable receipt (visible ONLY when printing) ───── */}
      <div className="hidden print:block p-8 max-w-3xl mx-auto font-sans text-gray-900">
        <div className="border-b-2 border-gray-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <p className="text-gray-500 mt-2 font-medium">Official Payment Receipt</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">PAID</p>
            <p className="text-sm text-gray-500 font-mono mt-1">{new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Information</h3>
            <p className="font-mono text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Order ID:</span> {order?.display_order_id || orderId}</p>
            <p className="font-mono text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Transaction ID:</span> {txnId}</p>
            <p className="font-mono text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Date:</span> {order?.order_date ? new Date(order.order_date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-800 mt-3"><span className="font-semibold text-gray-500">Buyer:</span> {order?.buyer_name || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Item Details</h3>
            <p className="text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Auction:</span> {order?.auction_name || "N/A"}</p>
            <p className="text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Grade:</span> {order?.grade || "N/A"}</p>
            <p className="text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Quantity:</span> {order?.quantity ? `${order.quantity} kg` : "N/A"}</p>
            <p className="text-sm text-gray-800 mt-3"><span className="font-semibold text-gray-500">Seller:</span> {order?.seller_name || order?.estate_name || "N/A"}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-12">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 font-bold text-gray-700">Description</th>
              <th className="py-3 font-bold text-gray-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-gray-100">
              <td className="py-4 text-gray-800">{order?.auction_name || "Tea Order Payment"}</td>
              <td className="py-4 text-right font-mono text-gray-800">LKR {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 text-gray-600">Tax (10%)</td>
              <td className="py-4 text-right font-mono text-gray-600">LKR {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-4 text-gray-600">Platform Fee (2%)</td>
              <td className="py-4 text-right font-mono text-gray-600">LKR {platformFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="py-6 font-black text-xl text-gray-900">Total Paid</td>
              <td className="py-6 font-black text-xl text-right text-[#344e41]">LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-center text-sm text-gray-500 mt-20 pt-8 border-t border-gray-200 flex flex-col items-center">
          <p className="max-w-md mx-auto text-gray-400 font-medium leading-relaxed">
            Intelligent solutions for a smarter tea industry.
          </p>
        </div>
      </div>
    </>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}