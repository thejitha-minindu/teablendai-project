"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Plus, Leaf, ArrowRight, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const [chartValue, setChartValue] = useState(2998);

  // Simple animation for the chart numbers
  useEffect(() => {
    const interval = setInterval(() => {
      setChartValue(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch min-h-[600px] px-4 py-8">
      
      {/* --- Left Card: Analytics Overview (Cleaned up slightly) --- */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
         
         {/* Header */}
         <div className="flex justify-between items-start z-10">
            <div>
               <h3 className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Live Activity</h3>
               <div className="flex items-center gap-2">
                 <TrendingUp className="w-6 h-6 text-[#4F772D]" />
                 <span className="text-2xl font-bold text-gray-800">Total Sessions</span>
               </div>
            </div>
            <div className="bg-green-50 p-2 rounded-full">
              <BarChart3 className="w-6 h-6 text-[#4F772D]" />
            </div>
         </div>

         {/* Chart Circle Visualization */}
         <div className="flex-1 flex items-center justify-center py-8 z-10">
            <div className="relative w-56 h-56 flex items-center justify-center">
               {/* Animated Rings */}
               <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
               <div className="absolute inset-0 rounded-full border-[3px] border-[#4F772D] border-t-transparent animate-spin-slow opacity-20" />
               <div className="absolute inset-4 rounded-full border-[12px] border-[#D4E2C6]/30" />
               
               {/* Center Text */}
               <div className="text-center">
                  <span className="block text-4xl font-extrabold text-[#1A2F1C] tracking-tight">
                    {chartValue.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Active Views
                  </span>
               </div>
            </div>
         </div>

         {/* Footer */}
         <div className="z-10">
            <div className="h-px w-full bg-gray-100 mb-4" />
            <div className="flex justify-between items-center text-sm">
               <span className="text-[#A3B18A] font-bold">Monthly Trends</span>
               <span className="text-gray-400">(All Districts)</span>
            </div>
         </div>
      </div>

      {/* --- Right Card: Create Auction (THE REDESIGN) --- */}
      <div className="relative bg-gradient-to-br from-[#3A5A40] to-[#1A2F1C] p-10 md:p-14 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-start text-left overflow-hidden group hover:-translate-y-1 transition-all duration-500">
        
        {/* Background Decorative Elements (Glows & Icons) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-white/10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4F772D] rounded-full blur-3xl -ml-10 -mb-10 opacity-50" />
        
        {/* Giant Subtle Leaf Background */}
        <Leaf className="absolute -right-6 -bottom-12 w-80 h-80 text-white/5 rotate-12 group-hover:rotate-0 group-hover:scale-105 transition-all duration-700 ease-out" />

        {/* Card Content */}
        <div className="relative z-10 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#4F772D] animate-pulse" />
            Seller Action
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-[1.1]">
            Ready to Sell <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4E2C6] to-white">
              Your Tea?
            </span>
          </h2>
          
          {/* Description */}
          <p className="text-gray-300 mb-10 text-lg max-w-md leading-relaxed font-medium">
            Create a new auction instantly. Set your grade, quantity, and base price to reach thousands of global buyers.
          </p>
          
          {/* Action Button */}
          <Link 
            href="/seller/create-auction"
            className="group/btn relative inline-flex items-center gap-4 bg-white text-[#1A2F1C] font-bold py-5 px-8 pr-10 rounded-2xl text-lg shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all duration-300 w-full md:w-auto"
          >
            <div className="bg-[#4F772D] text-white p-2 rounded-xl group-hover/btn:rotate-90 transition-transform duration-300">
               <Plus className="w-6 h-6" />
            </div>
            <span>Create New Auction</span>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover/btn:text-[#1A2F1C] group-hover/btn:translate-x-1 transition-all ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}