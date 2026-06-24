"use client";

import React, { useState, useEffect } from 'react';
import { toast } from \'sonner\';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Lock, 
  Truck, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { getAuctionOrderDialog } from "@/services/buyer/auctionService";
import { apiClient } from "@/lib/apiClient";
import { getAuthClaims } from "@/lib/auth";

interface PaymentPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

interface CurrentUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  shipping_address?: string;
  phone_num?: string;
}

interface OrderData {
  auction_id: string;
  auction_name: string;
  estate_name: string;
  grade: string;
  quantity: number;
  sold_price: number;
  date: string;
  order_id: string;
}

export default function CheckoutPage({ params }: PaymentPageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [userData, setUserData] = useState<CurrentUser | null>(null);

  const orderId = resolvedParams.orderId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const currentUser = await apiClient.get<CurrentUser>("/users/me");
        setUserData(currentUser.data);

        // Get order data by orderId - find the order that matches this orderId
        const claims = getAuthClaims();
        if (!claims?.id) {
          throw new Error("User not authenticated");
        }

        // Fetch all orders for the current user
        const allOrdersResponse = await apiClient.get<OrderData[]>(`/buyer/auctions/user/${claims.id}/orders`);
        
        // Find the order matching the orderId from URL
        const foundOrder = allOrdersResponse.data.find(o => o.order_id === orderId);
        
        if (!foundOrder) {
          throw new Error(`Order ${orderId} not found`);
        }

        setOrderData(foundOrder);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  // Calculate totals
  const subtotal = orderData?.sold_price || 0;
  const tax = subtotal * 0.1; // 10% tax
  const platformFee = subtotal * 0.02; // 2% platform fee
  const total = subtotal + tax + platformFee;

  const processPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Update payment status to 'paid' via API
      await apiClient.patch(`/orders/${orderId}/payment`, {
        payment_status: "paid",
      });

      // Redirect to success page
      router.push(`/payment/success?orderId=${orderId}`);
    } catch (err: any) {
      console.error("Payment failed:", err);
      toast.error("Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans flex items-center justify-center">
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

  const deliveryAddress = userData?.shipping_address || "Address not provided";
  const buyerName = `${userData?.first_name} ${userData?.last_name}`.trim() || "Guest";

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-slate-500 hover:text-[#588157] font-bold transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Back
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <Lock className="w-3 h-3" /> 256-Bit Secure
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Payment Form */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-3xl text-slate-900 font-black mb-2 tracking-tight">Checkout</h2>
              <p className="text-slate-500 font-medium">Complete your purchase for {orderData?.auction_name || "your order"}.</p>
            </div>
            
            <form onSubmit={processPayment} className="space-y-10">
              {/* Payment Method Selector */}
              <div className="flex gap-4 flex-row flex-nowrap overflow-x-auto">
                {/* Card Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`relative flex-1 min-w-0 flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'card'
                    ? 'bg-white border-[#588157] shadow-md ring-4 ring-[#588157]/5'
                    : 'bg-slate-100/50 border-transparent hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-[#588157]' : 'border-slate-300'}`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-[#588157] rounded-full" />}
                    </div>
                    <div className="flex gap-1.5 opacity-80">
                      <img src="https://readymadeui.com/images/visa.webp" className="w-8" alt="Visa" />
                      <img src="https://readymadeui.com/images/master.webp" className="w-8" alt="MasterCard" />
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${paymentMethod === 'card' ? 'text-slate-900' : ''}`}>Credit / Debit Card</span>
                  <span className="text-[11px] mt-1 font-medium">Pay securely via Stripe</span>
                </button>

                {/* PayPal Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`relative flex-1 min-w-0 flex flex-col p-5 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === 'paypal'
                    ? 'bg-white border-[#588157] shadow-md ring-4 ring-[#588157]/5'
                    : 'bg-slate-100/50 border-transparent hover:border-slate-300 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'paypal' ? 'border-[#588157]' : 'border-slate-300'}`}>
                      {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 bg-[#588157] rounded-full" />}
                    </div>
                    <img src="https://readymadeui.com/images/paypal.webp" className="w-14" alt="PayPal" />
                  </div>
                  <span className={`font-bold text-sm ${paymentMethod === 'paypal' ? 'text-slate-900' : ''}`}>PayPal Account</span>
                  <span className="text-[11px] mt-1 font-medium">Log in to your account</span>
                </button>
              </div>

              {/* Conditional Content */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm transition-all">
                {paymentMethod === 'card' ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cardholder Name</label>
                      <input required type="text" placeholder="Johnathan Doe"
                        className="px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="col-span-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input required type="text" placeholder="0000 0000 0000 0000"
                          className="pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Expiry Date</label>
                      <input required type="text" placeholder="MM / YY"
                        className="px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CVV Code</label>
                      <input required type="password" placeholder="***" maxLength={3}
                        className="px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all" />
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <img src="https://readymadeui.com/images/paypal.webp" className="w-10" alt="PayPal" />
                    </div>
                    <p className="text-sm text-slate-600 font-medium max-w-xs mx-auto">
                      Click "Pay Now" to open the PayPal secure portal and complete your purchase.
                    </p>
                  </div>
                )}
              </div>

              {/* Secure Badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 grayscale opacity-60">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><ShieldCheck className="w-4 h-4 text-[#588157]" /> SSL Encrypted</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 className="w-4 h-4 text-[#588157]" /> PCI Compliant</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><Lock className="w-4 h-4 text-[#588157]" /> Secure Gateway</span>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Summary (Sticky) */}
          <aside className="lg:sticky lg:top-12 space-y-6">
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Order Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Order Amount</span>
                  <span className="text-slate-800">LKR {subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Tax (10%)</span>
                  <span className="text-slate-800">LKR {tax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-400">Platform Fee (2%)</span>
                  <span className="text-slate-800">LKR {platformFee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="h-px bg-slate-100 my-4" />
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-[#344e41] leading-none tracking-tighter">
                    LKR {total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => processPayment()}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : 'Pay Now'}
              </button>
            </div>

            {/* Logistics Info - Updated with actual buyer data */}
            <div className="bg-[#344e41] rounded-[1.5rem] p-6 text-white overflow-hidden relative group">
              <Truck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-2">Delivery Details</p>
                <p className="font-bold text-sm mb-1">{buyerName}</p>
                <p className="text-xs text-green-100/70 leading-relaxed mb-4">{deliveryAddress}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Estimated Delivery: TBD
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl">
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-3">Order Details</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Order ID</span>
                  <span className="font-semibold text-slate-900">{orderId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Item</span>
                  <span className="font-semibold text-slate-900">{orderData?.auction_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Grade</span>
                  <span className="font-semibold text-slate-900">{orderData?.grade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-semibold text-slate-900">{orderData?.quantity} kg</span>
                </div>
              </div>
            </div>

            {/* Escrow Shield */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl flex gap-4 items-start">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                <strong className="text-slate-900 block mb-0.5">Escrow Protected</strong>
                Funds are held securely and released only after you confirm the quality of the tea lot received.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
