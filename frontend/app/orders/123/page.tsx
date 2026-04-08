"use client";

import React, { useState } from 'react';
import { 
  CheckCircle, Truck, CreditCard, Package, Clock, MapPin, 
  ArrowLeft, ShieldCheck, User, MessageCircle // <--- Added MessageCircle here
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock Order Data (Simulating a database fetch)
const INITIAL_ORDER = {
  id: "123",
  teaName: "Premium BOPF - Nuwara Eliya",
  quantity: 1000, // kg
  totalPrice: 25000, // $
  orderDate: "2025-12-12",
  sellerBrand: "Kenmare Estate",
  buyerName: "Global Teas PLC",
  // Initial Status options: 'WON', 'PAID', 'SHIPPED', 'DELIVERED'
  status: 'WON', 
};

export default function OrderTrackingPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  
  // SIMULATE USER ROLE (Toggle this button in UI to test both sides!)
  const [currentUserRole, setCurrentUserRole] = useState<'SELLER' | 'BUYER'>('BUYER');
  
  const [order, setOrder] = useState(INITIAL_ORDER);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- ACTIONS ---

  // 1. Buyer: Make Payment
  const handlePayment = () => {
    // Navigate to the payment page we created earlier
    router.push(`/payment/${order.id}`);
  };

  // 2. Seller: Mark as Shipped
  const handleDispatch = () => {
    if (!confirm("Confirm that the lot has been handed over to the courier?")) return;
    setIsUpdating(true);
    setTimeout(() => {
      setOrder(prev => ({ ...prev, status: 'SHIPPED' }));
      setIsUpdating(false);
    }, 1000);
  };

  // 3. Buyer: Confirm Delivery
  const handleConfirmDelivery = () => {
    if (!confirm("Have you inspected and received the tea lot?")) return;
    setIsUpdating(true);
    setTimeout(() => {
      setOrder(prev => ({ ...prev, status: 'DELIVERED' }));
      setIsUpdating(false);
      alert("Order Completed! Funds released to Seller.");
    }, 1000);
  };

  // --- UI HELPERS ---

  const getStepStatus = (step: string) => {
    const steps = ['WON', 'PAID', 'SHIPPED', 'DELIVERED'];
    const currentIndex = steps.indexOf(order.status);
    const stepIndex = steps.indexOf(step);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Role Toggle (For Demo Purposes) */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
          
          {/* DEV TOOL: Role Switcher - Remove in production */}
          <div className="bg-white p-1 rounded-lg border border-gray-300 flex text-xs font-bold">
            <button 
              onClick={() => setCurrentUserRole('BUYER')}
              className={`px-3 py-1 rounded-md transition-colors ${currentUserRole === 'BUYER' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              View as Buyer
            </button>
            <button 
              onClick={() => setCurrentUserRole('SELLER')}
              className={`px-3 py-1 rounded-md transition-colors ${currentUserRole === 'SELLER' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              View as Seller
            </button>
          </div>
        </div>

        {/* --- ORDER CARD --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Order #{order.id}</h1>
              <p className="text-gray-500 text-sm">Placed on {new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {order.status === 'WON' && 'Awaiting Payment'}
              {order.status === 'PAID' && 'Processing'}
              {order.status === 'SHIPPED' && 'In Transit'}
              {order.status === 'DELIVERED' && 'Completed'}
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
                  <h2 className="font-bold text-lg text-gray-900">{order.teaName}</h2>
                  <p className="text-gray-600">Quantity: <span className="font-medium text-gray-900">{order.quantity} kg</span></p>
                  <p className="text-gray-600">Total: <span className="font-bold text-[#588157] text-lg">${order.totalPrice.toLocaleString()}</span></p>
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
                      {currentUserRole === 'BUYER' ? order.sellerBrand : order.buyerName}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verified Account
                    </div>
                  </div>
                </div>

                {/* --- NEW CONTACT BUTTON --- */}
                <button 
                  onClick={() => router.push(`/messages/${order.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  {currentUserRole === 'BUYER' ? 'Contact Seller' : 'Contact Buyer'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- TRACKING TIMELINE --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="font-bold text-lg text-gray-800 mb-8">Order Progress</h2>
          
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-4 bottom-10 w-0.5 bg-gray-200" />

            {/* STEP 1: WON */}
            <div className="relative flex gap-6 mb-10 group">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 border-4 transition-colors bg-white ${
                getStepStatus('WON') === 'completed' ? 'bg-green-50 border-green-500 text-green-600' : 'border-blue-500 text-blue-600 shadow-lg'
              }`}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="pt-3">
                <h3 className="font-bold text-gray-900">Auction Won</h3>
                <p className="text-gray-500 text-sm">Winner declared. Awaiting payment.</p>
              </div>
            </div>

            {/* STEP 2: PAYMENT */}
            <div className="relative flex gap-6 mb-10">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 border-4 transition-all bg-white ${
                getStepStatus('PAID') === 'completed' ? 'bg-green-50 border-green-500 text-green-600' : 
                getStepStatus('PAID') === 'current' ? 'border-blue-500 text-blue-600 shadow-lg' : 'border-gray-200 text-gray-300'
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="pt-1 flex-1">
                <h3 className={`font-bold ${getStepStatus('PAID') === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>Payment</h3>
                <p className="text-gray-500 text-sm mb-3">
                  {order.status === 'WON' ? 'Pending secure transfer.' : 'Payment confirmed securely.'}
                </p>
                
                {/* ACTION: BUYER PAYS */}
                {currentUserRole === 'BUYER' && order.status === 'WON' && (
                  <button 
                    onClick={handlePayment} 
                    disabled={isUpdating}
                    className="bg-[#588157] text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#3A5A40] transition-colors shadow-md disabled:opacity-50"
                  >
                    {isUpdating ? 'Processing...' : 'Pay Now Securely'}
                  </button>
                )}
              </div>
            </div>

            {/* STEP 3: SHIPPING */}
            <div className="relative flex gap-6 mb-10">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 border-4 transition-all bg-white ${
                getStepStatus('SHIPPED') === 'completed' ? 'bg-green-50 border-green-500 text-green-600' : 
                getStepStatus('SHIPPED') === 'current' ? 'border-blue-500 text-blue-600 shadow-lg' : 'border-gray-200 text-gray-300'
              }`}>
                <Truck className="w-6 h-6" />
              </div>
              <div className="pt-1 flex-1">
                <h3 className={`font-bold ${getStepStatus('SHIPPED') === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>Out for Delivery</h3>
                <p className="text-gray-500 text-sm mb-3">
                  {order.status === 'PAID' ? 'Waiting for seller to dispatch.' : 
                   order.status === 'SHIPPED' ? 'Tea lot is on the way to your warehouse.' : 
                   'Not yet shipped.'}
                </p>

                {/* ACTION: SELLER DISPATCHES */}
                {currentUserRole === 'SELLER' && order.status === 'PAID' && (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <p className="text-sm text-yellow-800 font-medium mb-3">Buyer has paid. Please arrange transport.</p>
                    <button 
                      onClick={handleDispatch}
                      disabled={isUpdating}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md w-full md:w-auto"
                    >
                      {isUpdating ? 'Updating...' : 'Mark as Shipped'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: DELIVERED */}
            <div className="relative flex gap-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 border-4 transition-all bg-white ${
                order.status === 'DELIVERED' ? 'border-green-500 bg-green-50 text-green-600 shadow-lg scale-110' : 'border-gray-200 text-gray-300'
              }`}>
                <MapPin className="w-6 h-6" />
              </div>
              <div className="pt-1 flex-1">
                <h3 className={`font-bold ${order.status === 'DELIVERED' ? 'text-green-700' : 'text-gray-400'}`}>Delivered</h3>
                <p className="text-gray-500 text-sm mb-3">
                  {order.status === 'DELIVERED' ? 'Delivery confirmed by buyer.' : 'Awaiting confirmation.'}
                </p>

                {/* ACTION: BUYER CONFIRMS */}
                {currentUserRole === 'BUYER' && order.status === 'SHIPPED' && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-3">Has the shipment arrived?</p>
                    <button 
                      onClick={handleConfirmDelivery}
                      disabled={isUpdating}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-colors shadow-md w-full md:w-auto flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isUpdating ? 'Confirming...' : 'Confirm Delivery'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}