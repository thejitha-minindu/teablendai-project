"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, Download } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "123";
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 200);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div
        className={`bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border-t-8 border-green-500 transition-all duration-700 transform ${
          showContent
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0"
        }`}
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>

        <p className="text-gray-500 mb-8">
          Thank you for your payment. Your funds are now in escrow and the seller has been notified.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase font-bold">
              Transaction ID
            </span>
            <span className="text-sm font-mono text-gray-700">
              TXN-8842-API
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-xs text-gray-500 uppercase font-bold">
              Order ID
            </span>
            <span className="text-sm font-mono text-gray-700">
              {orderId}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* ✅ TRACK ORDER BUTTON */}
          {orderId ? (
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              Track Order Status
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-200 cursor-not-allowed text-gray-600 font-bold py-3 rounded-xl opacity-60 flex items-center justify-center gap-2"
            >
              Track Order Status
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}