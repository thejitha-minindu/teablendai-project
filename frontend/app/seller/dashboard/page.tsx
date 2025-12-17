"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Leaf, ArrowRight, DollarSign, Users, RefreshCw, Calendar as CalendarIcon } from "lucide-react";

// Components
import { ChartPie } from "@/components/features/buyer/ChartPie"; 
import { Calendar } from "@/components/ui/calendar";
import { AuctionCard } from "@/components/features/seller/AuctionCard"; 

// Helper: Date Formatting
const formatDateTitle = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
};

// Helper: Compare Dates
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export default function SellerDashboardPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // --- 1. MOCK DATA SETUP ---
  const today = new Date();
  // Reset time part for accurate comparison
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const allAuctions = [
    {
        id: "Auction #104",
        grade: "BOPF",
        quantity: 800,
        price: 1200,
        sellerBrand: "Kenmare Estate",
        date: tomorrow.toISOString().split('T')[0], // Scheduled (Tomorrow)
        time: "10:00 AM",
        status: "Scheduled"
    },
    {
        id: "Auction #105",
        grade: "Dust-1",
        quantity: 500,
        price: 950,
        sellerBrand: "Kenmare Estate",
        date: dayAfter.toISOString().split('T')[0], // Scheduled (Day after)
        time: "02:00 PM",
        status: "Scheduled"
    },
    {
        id: "Auction #106",
        grade: "FBOP",
        quantity: 300,
        price: 2100,
        sellerBrand: "Kenmare Estate",
        date: today.toISOString().split('T')[0], // ACTIVE (Today)
        time: "08:00 AM",
        status: "Live"
    },
    {
        id: "Auction #102",
        grade: "Pekoe",
        quantity: 1200,
        price: 1800,
        sellerBrand: "Kenmare Estate",
        date: yesterday.toISOString().split('T')[0], // PAST (Yesterday)
        status: "Sold",
    }
  ];

  // --- 2. CALENDAR STYLING LOGIC ---
  const { activeDates, scheduledDates, pastDates } = useMemo(() => {
    const active: Date[] = [];
    const scheduled: Date[] = [];
    const past: Date[] = [];

    allAuctions.forEach(auction => {
        const auctionDate = new Date(auction.date);
        auctionDate.setHours(0,0,0,0); // Normalize time
        
        if (isSameDay(auctionDate, today)) {
            active.push(auctionDate);
        } else if (auctionDate > today) {
            scheduled.push(auctionDate);
        } else {
            past.push(auctionDate);
        }
    });

    return { activeDates: active, scheduledDates: scheduled, pastDates: past };
  }, [allAuctions]);

  // --- 3. FILTER LOGIC (FIXED: Defaults to Today, avoids mess) ---
  
  // If a date is selected on calendar, use it. Otherwise, use TODAY.
  const targetDate = selectedDate || today;
  
  const displayedAuctions = allAuctions.filter(a => {
      // Need to adjust the auction string date to local object for comparison
      const aDate = new Date(a.date);
      // Fix timezone offset issues for string dates like "2025-12-16"
      aDate.setMinutes(aDate.getMinutes() + aDate.getTimezoneOffset());
      return isSameDay(aDate, targetDate);
  });

  return (
    <div className="px-4 sm:px-6 py-8 min-h-screen rounded-xl bg-[#FFFFFF]">
      
      {/* 1. Page Title & Quick Stats */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2F1C]">Seller Dashboard</h1>
          <p className="text-gray-500">Welcome back, Kenmare Estate</p>
        </div>
      </div>

      {/* --- ROW 1: Chart & Hero Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        
        {/* Left: Chart */}
        <div className="lg:col-span-1 h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-center items-center min-h-[420px]">
                <h3 className="font-bold text-gray-700 mb-6 text-center">Sales Distribution</h3>
                <div className="flex-1 flex items-center justify-center w-full">
                    <ChartPie /> 
                </div>
            </div>
        </div>

        {/* Right: Create Auction Hero */}
        <div className="lg:col-span-3 h-full">
            <div 
                className="relative bg-gradient-to-br from-[#2D4A2B] via-[#3A5A40] to-[#1A2F1C] rounded-2xl shadow-xl overflow-hidden group h-full flex items-center min-h-[420px]"
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
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4 px-2">
                    <h3 className="font-bold text-gray-700">Calendar</h3>
                    {selectedDate && (
                        <button 
                            onClick={() => setSelectedDate(undefined)}
                            className="text-[10px] uppercase font-bold text-[#3A5A40] bg-[#E5F7CB] px-2 py-1 rounded-md hover:bg-[#3A5A40] hover:text-white transition-colors"
                        >
                            Reset to Today
                        </button>
                    )}
                </div>
                
                <Calendar 
                    mode="single"
                    selected={selectedDate || today} 
                    onSelect={setSelectedDate}
                    className="rounded-md border-none w-full" 
                    
                    // --- CALENDAR COLOR LOGIC ---
                    modifiers={{
                        active: activeDates,     // Green (Today/Live)
                        scheduled: scheduledDates, // Orange (Future)
                        past: pastDates          // Gray (Past)
                    }}
                    modifiersClassNames={{
                        active: "bg-green-100 text-green-700 font-bold hover:bg-green-200 rounded-full",
                        scheduled: "bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 rounded-full",
                        past: "bg-gray-100 text-gray-400 line-through hover:bg-gray-200 rounded-full"
                    }}
                />

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-3 text-xs w-full px-2">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Live/Today</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Scheduled</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Past</div>
                </div>
            </div>
        </div>

        {/* Right: Listings Grid */}
        <div className="lg:col-span-3 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[#1A2F1C]">
                        {/* Dynamic Title based on selection */}
                        {isSameDay(targetDate, today) ? "Today's Auctions" : `Auctions on ${formatDateTitle(targetDate)}`}
                    </h2>
                </div>
                
                {!isSameDay(targetDate, today) && (
                    <Link href="/seller/history" className="text-sm font-semibold text-[#3A5A40] hover:text-[#2D4A2B] hover:underline">
                        View History
                    </Link>
                )}
            </div>

            {displayedAuctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedAuctions.map((auction, idx) => (
                        <AuctionCard 
                            key={idx}
                            id={auction.id}
                            type={auction.status === 'Sold' || new Date(auction.date) < today ? 'history' : (auction.status === 'Live' ? 'live' : 'scheduled')} 
                            data={auction}
                        />
                    ))}
                </div>
            ) : (
                /* --- FIXED EMPTY STATE UI --- 
                   Added min-height and flex center to prevent "Messy" collapse 
                */
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-white rounded-3xl border border-dashed border-gray-300 p-8 text-center">
                    <div className="w-16 h-16 bg-[#F5F7EB] rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-[#A3B18A]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Auctions Found</h3>
                    <p className="text-gray-500 max-w-sm">
                        You don't have any auctions scheduled for <span className="font-semibold text-[#3A5A40]">{formatDateTitle(targetDate)}</span>.
                    </p>
                    
                    {/* Show "Create" button if date is today or future */}
                    {targetDate >= today && (
                        <Link href="/seller/create-auction" className="mt-6 text-sm font-bold text-white bg-[#3A5A40] px-6 py-2.5 rounded-full hover:bg-[#2D4A2B] transition-colors">
                            Schedule New Auction
                        </Link>
                    )}
                </div>
            )}
        </div>
      </div>

    </div>
  );
}