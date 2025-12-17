"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Plus, Leaf, ArrowRight, DollarSign, Users } from "lucide-react";

import { ChartPie } from "@/components/features/buyer/ChartPie"; 
import { Calendar } from "@/components/ui/calendar";
import { AuctionCard } from "@/components/features/seller/AuctionCard"; 

export default function SellerDashboardPage() {
  const [isHovered, setIsHovered] = useState(false);

  // Mock Data
  const recentAuctions = [
    {
        id: "Auction #104",
        grade: "BOPF",
        quantity: 800,
        price: 1200,
        sellerBrand: "Kenmare Estate",
        date: "2025-12-20",
        time: "10:00 AM",
        createdDate: "2025-12-15",
        startTimeRaw: new Date(Date.now() + 86400000).toISOString(), 
    },
    {
        id: "Auction #105",
        grade: "Dust-1",
        quantity: 500,
        price: 950,
        sellerBrand: "Kenmare Estate",
        date: "2025-12-21",
        time: "02:00 PM",
        createdDate: "2025-12-15",
        startTimeRaw: new Date(Date.now() + 172800000).toISOString(),
    },
    {
        id: "Auction #102",
        grade: "Pekoe",
        quantity: 1200,
        price: 1800,
        sellerBrand: "Kenmare Estate",
        status: "Sold",
        buyer: "Global Teas Ltd",
        createdDate: "2025-12-10",
    }
  ];

  return (
    <div className="px-4 sm:px-6 py-8 min-h-screen rounded-xl">
      
      {/* 1. Page Title & Quick Stats */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2F1C]">Seller Dashboard</h1>
          <p className="text-gray-500">Welcome back, Kenmare Estate</p>
        </div>
      </div>

      {/* --- ROW 1: Chart & Hero Section (Heights matched via grid) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        
        {/* Left: Chart */}
        <div className="lg:col-span-1 h-full">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col justify-center items-center">
                <h3 className="font-bold text-gray-700 mb-6 text-center">Sales Distribution</h3>
                <div className="flex-1 flex items-center justify-center w-full">
                    <ChartPie /> 
                </div>
            </div>
        </div>

        {/* Right: Create Auction Hero */}
        <div className="lg:col-span-3 h-full">
            <div 
                className="relative bg-gradient-to-br from-[#2D4A2B] via-[#3A5A40] to-[#1A2F1C] rounded-2xl shadow-xl overflow-hidden group h-full flex items-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Background Decor */}
                <div className="absolute inset-0 opacity-20">
                    <Leaf className="absolute -right-10 -bottom-10 w-64 h-64 text-white rotate-12 transition-all duration-700 group-hover:rotate-0 group-hover:scale-110" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                </div>

                <div className="relative z-10 px-8 md:px-12 py-10 w-full">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/10 text-white text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-[#E5F7CB] animate-pulse" />
                            Quick Action
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                            Create Your <br/>
                            <span className="text-[#E5F7CB]">Next Auction</span>
                        </h2>
                        
                        <p className="text-gray-200 text-lg mb-8 font-medium">
                            Ready to sell? Define your grade, set your price, and reach global buyers in minutes.
                        </p>

                        <Link 
                            href="/seller/create-auction"
                            className="inline-flex items-center gap-3 bg-white text-[#1A2F1C] font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group/btn"
                        >
                            <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-500 text-[#3A5A40]" />
                            <span>Create New Auction</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover/btn:text-[#3A5A40] group-hover/btn:translate-x-1 transition-all" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- ROW 2: Calendar & Listings --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left: Calendar */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex justify-center">
                <Calendar className="rounded-md border-none w-full" />
            </div>
        </div>

        {/* Right: Listings Grid */}
        <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#1A2F1C]">Recent Activity</h2>
                <Link href="/seller/history" className="text-sm font-semibold text-[#3A5A40] hover:text-[#2D4A2B] hover:underline">
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentAuctions.map((auction, idx) => (
                    <AuctionCard 
                        key={idx}
                        id={auction.id}
                        type={auction.status === 'Sold' ? 'history' : 'scheduled'} 
                        data={auction}
                    />
                ))}
            </div>
        </div>
      </div>

    </div>
  );
}