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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'stripe' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Card form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Fetch Order Details
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
      if (data.buyer_name && !cardholderName) {
        setCardholderName(data.buyer_name);
      }
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

  // Card Number Formatter (0000 0000 0000 0000)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = rawValue.match(/.{1,4}/g)?.join(' ') || rawValue;
    setCardNumber(formatted);
  };

  // Expiry Date Formatter (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (rawValue.length >= 3) {
      setExpiryDate(`${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`);
    } else {
      setExpiryDate(rawValue);
    }
  };

  // CVV Formatter (3-4 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(rawValue);
  };

  // Process Direct Card Payment / Bank Payment
  const handleDirectPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 15) {
        toast.error("Please enter a valid 16-digit card number.");
        return;
      }
      if (expiryDate.length < 5) {
        toast.error("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (cvv.length < 3) {
        toast.error("Please enter a valid security code (CVV).");
        return;
      }
      if (!cardholderName.trim()) {
        toast.error("Please enter the cardholder name.");
        return;
      }
    }

    setIsProcessing(true);
    try {
      // Update order payment status to paid in backend
      await updatePaymentStatus(orderId, 'paid');
      toast.success("Payment completed successfully!");
      router.push(`/payment/success?orderId=${orderId}`);
    } catch (err: any) {
      console.error("Payment processing error:", err);
      toast.error(err?.response?.data?.detail || "Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

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
          <RefreshCw className="w-10 h-10 text-[#588157] animate-spin mx-auto mb-4" />
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
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
          </div>
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

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Payment Method & Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl text-slate-900 font-black tracking-tight mb-2">Secure Checkout</h1>
              <p className="text-slate-500 text-sm">
                Complete payment for Order <span className="font-mono font-bold text-slate-800">{order.display_order_id || `#${order.order_id.slice(0, 8)}`}</span>
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Direct Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-white border-[#588157] shadow-md ring-4 ring-[#588157]/10'
                    : 'bg-slate-100/70 border-transparent hover:border-slate-300 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-[#588157]' : 'border-slate-300'}`}>
                    {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-[#588157] rounded-full" />}
                  </div>
                  <div className="flex gap-1">
                    <img src="https://readymadeui.com/images/visa.webp" className="w-7 h-4 object-contain" alt="Visa" />
                    <img src="https://readymadeui.com/images/master.webp" className="w-7 h-4 object-contain" alt="MasterCard" />
                  </div>
                </div>
                <span className={`font-bold text-sm ${paymentMethod === 'card' ? 'text-slate-900' : ''}`}>Credit / Debit Card</span>
                <span className="text-xs text-slate-500 mt-0.5">Instant Card Payment</span>
              </button>

              {/* Option 2: Stripe Gateway */}
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                  paymentMethod === 'stripe'
                    ? 'bg-white border-[#588157] shadow-md ring-4 ring-[#588157]/10'
                    : 'bg-slate-100/70 border-transparent hover:border-slate-300 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'stripe' ? 'border-[#588157]' : 'border-slate-300'}`}>
                    {paymentMethod === 'stripe' && <div className="w-2.5 h-2.5 bg-[#588157] rounded-full" />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Stripe</span>
                </div>
                <span className={`font-bold text-sm ${paymentMethod === 'stripe' ? 'text-slate-900' : ''}`}>Stripe Checkout</span>
                <span className="text-xs text-slate-500 mt-0.5">Hosted Stripe Portal</span>
              </button>

              {/* Option 3: Bank Transfer / Escrow */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                  paymentMethod === 'bank'
                    ? 'bg-white border-[#588157] shadow-md ring-4 ring-[#588157]/10'
                    : 'bg-slate-100/70 border-transparent hover:border-slate-300 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank' ? 'border-[#588157]' : 'border-slate-300'}`}>
                    {paymentMethod === 'bank' && <div className="w-2.5 h-2.5 bg-[#588157] rounded-full" />}
                  </div>
                  <Building className="w-4 h-4 text-slate-400" />
                </div>
                <span className={`font-bold text-sm ${paymentMethod === 'bank' ? 'text-slate-900' : ''}`}>Bank Transfer</span>
                <span className="text-xs text-slate-500 mt-0.5">Escrow Bank Account</span>
              </button>
            </div>

            {/* Payment Method Content */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              {paymentMethod === 'card' && (
                <form onSubmit={handleDirectPayment} className="space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#588157]" /> Card Details
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fast & Secure</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Cardholder Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Johnathan Doe"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="4532 •••• •••• 4242"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm font-mono rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                        Expiry Date
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="MM / YY"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm font-mono text-center rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">
                        CVV / CVC
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCvvChange}
                        maxLength={4}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 w-full text-sm font-mono text-center rounded-xl focus:ring-4 focus:ring-[#588157]/10 focus:border-[#588157] focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isProcessing || isPaid}
                      className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-green-900/10 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Authorizing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay LKR {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} Now
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {paymentMethod === 'stripe' && (
                <div className="py-4 text-center space-y-5">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Stripe Checkout Portal</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      You will be redirected to the secure Stripe portal to complete your payment with global card methods.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={isProcessing || isPaid}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-900/10 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Connecting to Stripe...
                      </>
                    ) : (
                      <>
                        Proceed to Stripe Checkout
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Building className="w-5 h-5 text-[#588157]" /> Escrow Bank Transfer Details
                    </h3>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-bold text-slate-800">Commercial Bank of Ceylon</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Name:</span>
                      <span className="font-bold text-slate-800">TeaBlend AI Escrow Services PLC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Number:</span>
                      <span className="font-mono font-bold text-[#588157]">8004921004</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Branch:</span>
                      <span className="font-bold text-slate-800">Colombo Fort (001)</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Reference:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {order.display_order_id || order.order_id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Please use your Order ID as the transfer description. Once transfer is completed, click below to confirm.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleDirectPayment()}
                    disabled={isProcessing || isPaid}
                    className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Submitting Escrow Confirmation...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Escrow Payment
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-slate-400">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#588157]" /> SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#588157]" /> PCI-DSS Level 1
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4 text-[#588157]" /> Escrow Secured
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Logistics */}
          <aside className="lg:sticky lg:top-8 space-y-6">
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

              {/* Status Badge */}
              <div className={`p-3 rounded-xl text-center text-xs font-bold ${
                isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isPaid ? '✅ Payment Completed' : '⏳ Awaiting Buyer Payment'}
              </div>
            </div>

            {/* Escrow Shield Card */}
            <div className="bg-[#344e41] rounded-3xl p-6 text-white overflow-hidden relative group">
              <Truck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected Trade
                </p>
                <p className="font-bold text-sm mb-1">Guaranteed Quality Assurance</p>
                <p className="text-xs text-green-100/80 leading-relaxed mb-3">
                  Your funds are held safely in escrow and released to the seller only after lot delivery confirmation.
                </p>
              </div>
            </div>

            {/* Back to Tracking Link */}
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#588157] py-2 transition-colors flex items-center justify-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> View Order Tracking & Progress
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
