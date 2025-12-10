"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserCircle } from 'lucide-react';
import '../../app/globals.css';

export function SellerNavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/seller/dashboard' },
    { name: 'Auction History', href: '/seller/history' },
    { name: 'Live Auction', href: '/seller/live' },
    { name: 'Scheduled Auction', href: '/seller/scheduled' },
    { name: 'Chat Bot', href: '/chatbot' },
  ];

  return (
    <nav className="flex justify-between items-center py-4 px-8 bg-[var(--color1)] shadow-sm">
      <div className="flex items-center gap-3">
        <Image 
          src="/logo.png" 
          alt="TeaBlend AI Logo" 
          width={140} 
          height={40} 
          className="object-contain"
        />
      </div>

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

      <div className="flex items-center gap-4">
        <button className="text-sm font-semibold text-gray-700 hover:text-[#3A5A40] transition-colors">
          Become a Buyer
        </button>
        <UserCircle className="w-8 h-8 text-gray-600 cursor-pointer hover:text-[#3A5A40] transition-colors" />
      </div>
    </nav>
  );
}