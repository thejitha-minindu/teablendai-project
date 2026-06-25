"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [showContent, setShowContent] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Small animation delay
    setTimeout(() => setShowContent(true), 200);

    // Verify payment with backend
    const verifyPayment = async () => {
      if (orderId) {
        try {
          const { apiClient } = await import('@/lib/apiClient');
          await apiClient.get(`/payment/verify/${orderId}`);
          // Fetch order details for the receipt
          const orderRes = await apiClient.get(`/orders/${orderId}`);
          setOrder(orderRes.data);
        } catch (error) {
          console.error("Failed to verify payment status:", error);
        } finally {
          setVerifying(false);
        }
      } else {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Normal UI - Hidden during printing */}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 print:hidden">
        <div className={`bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border-t-8 border-green-500 transition-all duration-700 transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-8">
            Thank you for your payment. Your funds are now in escrow and the seller has been notified to start shipping.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase font-bold">Transaction ID</span>
              <span className="text-sm font-mono text-gray-700">TXN-8842-API</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 uppercase font-bold">Order ID</span>
              <span className="text-sm font-mono text-gray-700">{order?.display_order_id || orderId}</span>
            </div>
            {order?.total_amount && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 uppercase font-bold">Total Paid</span>
                <span className="text-sm font-bold text-[#344e41]">LKR {(order.total_amount * 1.12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => orderId ? router.push(`/orders/${orderId}`) : null}
              disabled={!orderId || verifying}
              className={`w-full ${orderId && !verifying ? 'bg-[#588157] hover:bg-[#3A5A40]' : 'bg-gray-200 cursor-not-allowed'} text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${(!orderId || verifying) ? 'opacity-60' : ''}`}
            >
              {verifying ? 'Verifying Payment...' : 'Track Order Status'} {verifying ? null : <ArrowRight className="w-4 h-4" />}
            </button>

            <button 
              onClick={handlePrint}
              disabled={!order}
              className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt - Visible ONLY during printing */}
      <div className="hidden print:block p-8 max-w-3xl mx-auto font-sans text-gray-900">
        <div className="border-b-2 border-gray-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <img src="/TeaLogo.png" alt="TeaBlend AI Logo" className="h-16 w-auto object-contain" />
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
            <p className="font-mono text-sm text-gray-800 mb-1"><span className="font-semibold text-gray-500">Transaction ID:</span> TXN-8842-API</p>
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
              <td className="py-4 text-right font-mono text-gray-800">
                LKR {order?.total_amount ? order.total_amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-4 text-gray-600">Tax (10%)</td>
              <td className="py-4 text-right font-mono text-gray-600">
                LKR {order?.total_amount ? (order.total_amount * 0.1).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-4 text-gray-600">Platform Fee (2%)</td>
              <td className="py-4 text-right font-mono text-gray-600">
                LKR {order?.total_amount ? (order.total_amount * 0.02).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
              </td>
            </tr>
            <tr>
              <td className="py-6 font-black text-xl text-gray-900">Total Paid</td>
              <td className="py-6 font-black text-xl text-right text-[#344e41]">
                LKR {order?.total_amount ? (order.total_amount * 1.12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-center text-sm text-gray-500 mt-20 pt-8 border-t border-gray-200 flex flex-col items-center">
          <img 
            src="/TeaLogoDark.png" 
            alt="TeaBlend AI Logo" 
            className="h-14 w-auto mb-4 object-contain" 
            onError={(e) => {
              // Fallback to the light PNG if dark logo is missing
              (e.target as HTMLImageElement).src = "/TeaLogo.png";
            }}
          />
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