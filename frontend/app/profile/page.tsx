"use client";

import React, { useEffect, useState } from 'react';
import { 
  User, MapPin, Camera, Save, Edit2, 
  ShoppingBag, TrendingUp, CreditCard, ShieldCheck, LayoutDashboard,
  Package, Lock, LogOut, Star, BarChart3, 
  Wallet, ListOrdered, History, Truck, X
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';

type ProfileFormState = {
  role: 'buyer' | 'seller';
  first_name: string;
  last_name: string;
  email: string;
  phone_num: string;
  profile_image_url: string;
  nic: string;
  shipping_address: string;
  payment_method: string;
  brand: string;
  sellerRating: number;
  totalReviews: number;
  totalRevenue: number;
  ordersReceived: number;
  activeLots: number;
  payoutBank: string;
  totalSpent: number;
  totalOrders: number;
  disputes: number;
};

const defaultProfileState: ProfileFormState = {
  role: 'buyer',
  first_name: "John",
  last_name: "Wickramasinghe",
  email: "john.w@kenmare.com",
  phone_num: "+94 77 123 4567",
  profile_image_url: "",
  nic: "952314578V",
  shipping_address: "No. 10, Colombo 03, Western Province",
  payment_method: "Visa ending in 4242",
  brand: "Kenmare Estate",
  sellerRating: 4.8,
  totalReviews: 124,
  totalRevenue: 125000,
  ordersReceived: 86,
  activeLots: 12,
  payoutBank: "Bank of Ceylon - **** 8829",
  totalSpent: 4500,
  totalOrders: 28,
  disputes: 0,
};

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'seller' | 'buyer'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Security States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

  // Mock Data for Sales
  const weeklySales = [
    { day: "Mon", value: 45, amount: "$1,200" },
    { day: "Tue", value: 72, amount: "$2,400" },
    { day: "Wed", value: 38, amount: "$900" },
    { day: "Thu", value: 85, amount: "$3,100" },
    { day: "Fri", value: 65, amount: "$1,800" },
    { day: "Sat", value: 92, amount: "$4,200" },
    { day: "Sun", value: 50, amount: "$1,500" },
  ];

  const [user, setUser] = useState<ProfileFormState>(defaultProfileState);

  const displayName = `${user.first_name} ${user.last_name}`.trim();
  const availableTabs = user.role === 'seller'
    ? [
        { id: 'personal' as const, label: 'Personal Profile' },
        { id: 'seller' as const, label: 'Seller Insights' },
      ]
    : [
        { id: 'personal' as const, label: 'Personal Profile' },
        { id: 'buyer' as const, label: 'Buyer Activity' },
      ];

  const handlePhotoEdit = () => {
    const imageUrl = window.prompt('Enter profile image URL');
    if (imageUrl === null) return;
    setUser((prev) => ({ ...prev, profile_image_url: imageUrl.trim() }));
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);
        const response = await apiClient.get('/profile/me');
        const profile = response.data;
        const accountNum = profile.financial_details?.account_num;
        const maskedAccount = accountNum && accountNum.length > 4
          ? `**** ${accountNum.slice(-4)}`
          : accountNum || 'Not set';

        setUser((prev) => ({
          ...prev,
          role: profile.default_role === 'seller' ? 'seller' : 'buyer',
          first_name: profile.first_name || prev.first_name,
          last_name: profile.last_name || prev.last_name,
          email: profile.email || prev.email,
          phone_num: profile.phone_num || prev.phone_num,
          profile_image_url: profile.profile_image_url || prev.profile_image_url,
          shipping_address: profile.shipping_address || prev.shipping_address,
          payment_method: profile.payment_method || prev.payment_method,
          payoutBank: profile.financial_details?.bank_name
            ? `${profile.financial_details.bank_name} - ${maskedAccount}`
            : prev.payoutBank,
        }));
      } catch (error) {
        console.error('Failed to load profile:', error);
        alert('Failed to load profile details from server.');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (user.role === 'buyer' && activeTab === 'seller') {
      setActiveTab('personal');
    }
    if (user.role === 'seller' && activeTab === 'buyer') {
      setActiveTab('personal');
    }
  }, [user.role, activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const saveProfile = async () => {
      setIsLoading(true);
      try {
        await apiClient.put('/profile/me', {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_num: user.phone_num,
          profile_image_url: user.profile_image_url || null,
          shipping_address: user.shipping_address,
          payment_method: user.payment_method,
        });
        setIsEditing(false);
        alert("Profile updated successfully!");
      } catch (error: any) {
        const message = error?.response?.data?.detail || "Failed to update profile.";
        alert(message);
      } finally {
        setIsLoading(false);
      }
    };

    saveProfile();
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert('Please fill all password fields');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert('New password and confirm password do not match');
      return;
    }

    setPwdLoading(true);
    try {
      await apiClient.put('/profile/change-password', {
        current_password: passwords.current,
        new_password: passwords.new,
      });
      setShowChangePassword(false);
      setPasswords({ current: "", new: "", confirm: "" });
      alert('Password updated successfully! Please log in again with your new password.');
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to update password';
      alert(message);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* --- HERO SECTION --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 pb-6">
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-100 shadow-lg overflow-hidden flex items-center justify-center">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={handlePhotoEdit}
                  className="absolute bottom-1 right-1 bg-[#588157] p-2 rounded-full text-white shadow-md hover:bg-[#4a6d49] transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{displayName}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                {user.role === 'seller' && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Seller Account
                  </span>
                )}
                {user.role === 'buyer' && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Verified Buyer
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Link href={user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            </div>
          </div>

          {/* TABS - Scrollable on Mobile */}
          <div className="flex items-center gap-6 md:gap-8 border-b border-gray-200 overflow-x-auto no-scrollbar">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'border-[#588157] text-[#588157]' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {isProfileLoading && (
            <div className="px-6 py-4 text-sm font-semibold text-gray-600 bg-[#F5F7EB] border-b border-gray-100">
              Loading profile details...
            </div>
          )}
          
          {/* CONTENT HEADER */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === 'personal' && 'Personal Information'}
              {activeTab === 'seller' && 'Estate & Business Intelligence'}
              {activeTab === 'buyer' && 'Purchasing & Order History'}
            </h2>
            <div className="w-full sm:w-auto">
              {isEditing ? (
                <div className="flex gap-2 w-full">
                  <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={isLoading} className="flex-1 sm:flex-none px-4 py-2 text-sm font-bold text-white bg-[#588157] rounded-lg flex items-center justify-center gap-2 hover:bg-[#4a6d49]">
                    {isLoading ? "Saving..." : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-[#588157] border border-[#588157] rounded-lg flex items-center justify-center gap-2 hover:bg-[#F5F7EB] transition-all">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* 1. PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'First Name', name: 'first_name', val: user.first_name },
                    { label: 'Last Name', name: 'last_name', val: user.last_name },
                    { label: 'Email Address', name: 'email', val: user.email },
                    { label: 'NIC Number', name: 'nic', val: user.nic },
                    { label: 'Phone', name: 'phone_num', val: user.phone_num },
                    { label: 'Address', name: 'shipping_address', val: user.shipping_address },
                    { label: 'Payment Method', name: 'payment_method', val: user.payment_method },
                  ].map((field) => (
                    <div key={field.name} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</label>
                      <input 
                        name={field.name} 
                        disabled={!isEditing} 
                        value={field.val} 
                        onChange={handleChange} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#588157]/20 focus:border-[#588157] outline-none transition-all disabled:opacity-70" 
                      />
                    </div>
                  ))}
                </div>
                
                <div className="pt-8 border-t">
                  <h4 className="text-sm font-bold text-gray-800 mb-4">Security & Access</h4>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => setShowChangePassword(!showChangePassword)} 
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all ${showChangePassword ? 'bg-gray-800 text-white' : 'bg-white hover:bg-gray-50'}`}
                    >
                      {showChangePassword ? <X className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {showChangePassword ? 'Close' : 'Change Password'}
                    </button>
                    <button onClick={() => alert('Revoked')} className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-600 rounded-lg text-sm font-semibold bg-red-50 hover:bg-red-100 transition-all">
                      <LogOut className="w-4 h-4" /> Revoke Other Sessions
                    </button>
                  </div>

                  {showChangePassword && (
                    <div className="mt-4 p-5 border rounded-2xl bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="password" 
                        placeholder="Current Password" 
                        className="p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#588157]" 
                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        className="p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#588157]" 
                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      />
                      <input 
                        type="password" 
                        placeholder="Confirm Password" 
                        className="p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#588157]" 
                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      />
                      <button 
                        onClick={handlePasswordUpdate} 
                        disabled={pwdLoading}
                        className="bg-[#588157] text-white rounded-lg font-bold hover:bg-[#4a6d49] transition-colors disabled:bg-gray-400 md:col-span-3"
                      >
                        {pwdLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. SELLER TAB */}
            {activeTab === 'seller' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: <Star className="text-yellow-500" />, label: 'Rating', val: user.sellerRating, sub: `(${user.totalReviews})` },
                    { icon: <TrendingUp className="text-green-500" />, label: 'Total Revenue', val: `$${user.totalRevenue.toLocaleString()}` },
                    { icon: <ListOrdered className="text-blue-500" />, label: 'Orders Rec.', val: user.ordersReceived },
                    { icon: <Package className="text-purple-500" />, label: 'Active Lots', val: user.activeLots },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm text-center hover:border-[#588157] transition-all">
                      <div className="flex justify-center mb-2">{stat.icon}</div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{stat.label}</p>
                      <p className="text-lg font-black text-gray-800">
                        {stat.val} {stat.sub && <span className="text-[10px] font-normal text-gray-400">{stat.sub}</span>}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* BAR CHART */}
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="flex items-center gap-2 font-bold text-gray-800">
                        <BarChart3 className="w-4 h-4 text-[#588157]" /> Weekly Sales
                      </h3>
                      <span className="text-[10px] font-bold text-[#588157] bg-[#588157]/10 px-2 py-1 rounded-md">LAST 7 DAYS</span>
                    </div>
                    
                    <div className="relative h-48 flex items-end justify-between gap-2 px-1">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03] px-1">
                        {[1, 2, 3, 4].map((i) => <div key={i} className="w-full border-t border-black" />)}
                      </div>

                      {(() => {
                        const max = Math.max(...weeklySales.map(s => s.value), 1);
                        return weeklySales.map((item, i) => (
                          <div key={i} className="group flex-1 flex flex-col items-center relative h-full justify-end">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 whitespace-nowrap shadow-xl">
                              {item.amount}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                            <div
                              style={{ height: `${(item.value / max) * 100}%` }}
                              className="w-full bg-[#588157] rounded-t-md transition-all duration-500 group-hover:bg-[#a3b18a] cursor-pointer"
                            />
                            <span className="mt-3 text-[10px] font-bold text-gray-400 group-hover:text-[#588157] transition-colors">{item.day}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* PAYOUT SECTION */}
                  <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4"><Wallet className="w-4 h-4 text-[#588157]" /> Payout Details</h3>
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Settlement Account</p>
                          <p className="text-sm font-bold text-gray-800">{user.payoutBank}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Available for Payout</p>
                          <p className="text-2xl font-black text-[#588157]">$2,450.00</p>
                        </div>
                      </div>
                    </div>
                    <button className="mt-6 w-full py-3 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-[#588157] hover:text-white hover:border-[#588157] transition-all uppercase tracking-wider">
                      Manage Payouts
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BUYER TAB */}
            {activeTab === 'buyer' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <button
                    onClick={() => alert('View spending details (mock)')}
                    className="flex-1 p-5 bg-blue-50 border border-blue-100 rounded-2xl text-left hover:shadow-md transition-all"
                  >
                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Spent</p>
                    <p className="text-2xl font-black text-blue-900">${user.totalSpent.toLocaleString()}</p>
                  </button>

                  <button
                    onClick={() => alert('View orders (mock)')}
                    className="flex-1 p-5 bg-gray-50 border border-gray-200 rounded-2xl text-left hover:shadow-md transition-all"
                  >
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Orders</p>
                    <p className="text-2xl font-black text-gray-800">{user.totalOrders}</p>
                  </button>

                  <button
                    onClick={() => alert('View disputes (mock)')}
                    className="flex-1 p-5 bg-red-50 border border-red-100 rounded-2xl text-left hover:shadow-md transition-all"
                  >
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Disputes</p>
                    <p className="text-2xl font-black text-red-900">{user.disputes}</p>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-3"><MapPin className="w-4 h-4 text-[#588157]" /> Shipping Address</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{user.shipping_address || 'Not set'}</p>
                    <button className="mt-4 text-xs font-bold text-[#588157] hover:underline uppercase tracking-tight">Change Address</button>
                  </div>
                  <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-3"><CreditCard className="w-4 h-4 text-[#588157]" /> Payment Method</h3>
                    <p className="text-sm text-gray-600">{user.payment_method || 'Not set'}</p>
                    <button className="mt-4 text-xs font-bold text-[#588157] hover:underline uppercase tracking-tight">Manage Cards</button>
                  </div>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4"><History className="w-5 h-5 text-[#588157]" /> Recent History</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'ORD-102', item: 'Silver Tips - Lot #12', date: 'Feb 05, 2024', status: 'Delivered', color: 'bg-green-100 text-green-700', price: '$450.00' },
                      { id: 'ORD-105', item: 'BOPF Premium Bulk', date: 'Feb 08, 2024', status: 'In Transit', color: 'bg-blue-100 text-blue-700', price: '$1,200.00' },
                      { id: 'ORD-098', item: 'Dust No.1 - Lot #09', date: 'Jan 28, 2024', status: 'Cancelled', color: 'bg-red-100 text-red-700', price: '$210.00' },
                    ].map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#588157] transition-all bg-white group cursor-pointer gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${order.color.split(' ')[0]}`}><Truck className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-gray-800 group-hover:text-[#588157] transition-colors">{order.item}</p>
                            <p className="text-xs text-gray-400 font-medium">{order.date} • ID: {order.id}</p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col justify-between items-center sm:items-end">
                          <p className="font-bold text-gray-800">{order.price}</p>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${order.color}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all uppercase tracking-widest">
                    View Full History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}