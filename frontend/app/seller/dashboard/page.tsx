"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const [chartValue, setChartValue] = useState(2998);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartValue(prev => prev + Math.floor(Math.random() * 10 - 5));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[80vh] px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl h-96 flex flex-col justify-center items-center hover:shadow-2xl transition-all duration-300">
        <h3 className="text-xl font-bold self-start mb-6 text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" /> Sessions
        </h3>
        <div className="w-48 h-48 rounded-full border-8 border-blue-200 flex items-center justify-center hover:border-blue-300 transition-all duration-300 relative">
          <div className="absolute inset-0 rounded-full animate-pulse bg-blue-100 opacity-20"></div>
          <div className="text-center z-10">
            <span className="block text-3xl font-bold text-gray-800">{chartValue.toLocaleString()}</span>
            <span className="text-xs text-gray-400 mt-1">Sessions</span>
          </div>
        </div>
        <div className="mt-8 self-start">
          <h4 className="text-[#A3B18A] font-bold text-lg">Monthly Tea Price</h4>
          <span className="text-xs text-gray-500">(by District)</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#ECF3E0] to-[#D4E2C6] p-12 rounded-3xl border-4 border-[#3A5A40] text-center shadow-2xl h-96 flex flex-col justify-center items-center hover:scale-105 transition-transform duration-300">
        <h2 className="text-4xl font-extrabold text-[#1A2F1C] mb-4 animate-fade-in">Ready to Sell Your Tea?</h2>
        <p className="text-[#4F5D45] mb-8 max-w-md text-lg">Create a new auction and set your desired tea grade, quantity, and starting price.</p>
        
        <Link 
          href="/seller/create-auction"
          className="bg-white text-black font-bold py-4 px-10 text-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
        >
          Create Auction
        </Link>
      </div>
    </div>
  );
}