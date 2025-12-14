
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserCircle, Plus, LogOut, User, ShoppingBag } from 'lucide-react';

export function SellerNavBar() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/seller/dashboard' },
    { name: 'Auction History', href: '/seller/history' },
    { name: 'Live Auction', href: '/seller/live' },
    { name: 'Scheduled Auction', href: '/seller/scheduled' },
    { name: 'Chat Bot', href: '/chatbot' },

  ];

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center py-4 px-8 bg-[#E5F7CB]/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all">
      {/* Logo Section */}
      <div className="flex items-center">
        <div className="relative h-12 w-40"> 
          <Image 
            src="/logo.png" 
            alt="TeaBlend AI Logo" 
            fill 
            sizes="(max-width: 768px) 100vw, 160px"
            className="object-contain object-left" 
            priority 
          />
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex space-x-8">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`text-sm font-semibold transition-all duration-200 pb-1 ${
                pathname === item.href 
                  ? "text-[#3A5A40] border-b-2 border-[#3A5A40]" 
                  : "text-gray-600 hover:text-[#3A5A40]"
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Right Actions */}
      <div className="flex items-center gap-4 relative">
        {/* 1. Create Auction Button (Replaces 'Become a Buyer') */}
        <Link 
          href="/seller/create-auction"
          className="flex items-center gap-2 bg-[#3A5A40] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-[#2A402E] transition-all hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Create Auction
        </Link>

        {/* 2. User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="focus:outline-none"
          >
            <UserCircle className={`w-9 h-9 text-gray-600 cursor-pointer hover:text-[#3A5A40] transition-colors ${isProfileOpen ? 'text-[#3A5A40]' : ''}`} />
          </button>

          {isProfileOpen && (
            <>
              {/* Overlay to close menu when clicking outside */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsProfileOpen(false)}
              ></div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800">Thejitha Minindu</p>
                  <p className="text-xs text-gray-500">Seller Account</p>
                </div>

                <div className="py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-[#F5F7EB] flex items-center gap-2 transition-colors">
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  
                  {/* Become a Buyer Moved Here */}
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-[#F5F7EB] flex items-center gap-2 transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                    Become a Buyer
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
