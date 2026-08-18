"use client";

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, Package, ArrowLeft } from 'lucide-react';

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      router.replace(`/payment/${orderId}`);
    }
  }, [orderId, router]);

  if (orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Redirecting to Checkout</h3>
          <p className="text-sm text-slate-500">Preparing payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#588157]">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Order Selected</h2>
        <p className="text-sm text-slate-500 mb-6">
          Please select an order from your buyer orders dashboard to proceed to checkout.
        </p>
        <button
          onClick={() => router.push('/buyer/orders')}
          className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> View My Orders
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
