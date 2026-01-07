"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus, Leaf, ArrowRight, Calendar as CalendarIcon } from "lucide-react";

// Components
import { ChartPie } from "@/components/features/buyer/ChartPie"; 
import { Calendar } from "@/components/ui/calendar";
import { AuctionCard } from "@/components/features/seller/AuctionCard"; 

// Import Modals
import { 
    LiveAuctionModal, 
    ScheduledAuctionModal, 
    HistoryAuctionModal 
} from "@/components/features/seller/AuctionModal";

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

// --- HELPER: Calculate Countdown ---
const calculateCountdown = (auction: any) => {
    const safeStart = auction.rawStart.endsWith('Z') ? auction.rawStart : auction.rawStart + 'Z';
    const startTime = new Date(safeStart).getTime();
    const now = new Date().getTime();

    let targetTime = 0;

    if (auction.type === 'live') {
        targetTime = startTime + (auction.duration * 60 * 60 * 1000);
    } else if (auction.type === 'scheduled') {
        targetTime = startTime;
    } else {
        return null; 
    }

    const diff = targetTime - now;
    if (diff <= 0) return auction.type === 'live' ? "Closing..." : "Starting...";

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0 && auction.type === 'scheduled') {
        return `${days}d ${hours}h ${minutes}m`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function SellerDashboardPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allAuctions, setAllAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE: Selected Auction for Modal ---
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);

  // Today's date
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // --- 1. FETCH DATA (Same as before) ---
  const fetchAllData = async () => {
      try {
        setLoading(true);
        const [liveRes, schedRes, histRes] = await Promise.all([
            fetch('http://localhost:8000/api/v1/auctions/status/live'),
            fetch('http://localhost:8000/api/v1/auctions/status/scheduled'),
            fetch('http://localhost:8000/api/v1/auctions/status/history')
        ]);

        const liveData = await liveRes.json();
        const schedData = await schedRes.json();
        const histData = await histRes.json();

        const normalize = (item: any, type: 'live' | 'scheduled' | 'history') => {
            const safeTime = item.start_time.endsWith('Z') ? item.start_time : item.start_time + 'Z';
            const dateObj = new Date(safeTime);
            
            const auctionObj = {
                id: 'Auction',
                grade: item.grade,
                quantity: item.quantity,
                price: item.base_price,
                sellerBrand: item.seller_brand || "My Estate",
                dateObj: dateObj,
                date: dateObj.toLocaleDateString(),
                time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: type === 'live' ? 'Live' : (type === 'history' ? (item.status || 'Sold') : 'Scheduled'),
                type: type,
                buyer: item.buyer,
                rawStart: item.start_time,
                duration: item.duration,
                countdown: null as string | null
            };
            auctionObj.countdown = calculateCountdown(auctionObj);
            return auctionObj;
        };

        const combined = [
            ...liveData.map((i: any) => normalize(i, 'live')),
            ...schedData.map((i: any) => normalize(i, 'scheduled')),
            ...histData.map((i: any) => normalize(i, 'history'))
        ];

        setAllAuctions(combined);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- 2. TIMER EFFECT ---
  useEffect(() => {
    const timer = setInterval(() => {
        setAllAuctions(prevAuctions => 
            prevAuctions.map(auc => {
                if (auc.type === 'history') return auc;
                return { ...auc, countdown: calculateCountdown(auc) };
            })
        );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 3. CALENDAR LOGIC ---
  const { activeDates, scheduledDates, pastDates } = useMemo(() => {
    const active: Date[] = [];
    const scheduled: Date[] = [];
    const past: Date[] = [];

    allAuctions.forEach(auction => {
        if (auction.type === 'live') {
            active.push(auction.dateObj);
            if (!isSameDay(auction.dateObj, today)) active.push(today);
        } else if (auction.type === 'scheduled') {
            scheduled.push(auction.dateObj);
        } else {
            past.push(auction.dateObj);
        }
    });
    return { activeDates: active, scheduledDates: scheduled, pastDates: past };
  }, [allAuctions, today]);

  // --- 4. FILTER LOGIC ---
  const targetDate = selectedDate || today;
  const displayedAuctions = allAuctions.filter(a => {
      if (isSameDay(targetDate, today) && a.type === 'live') return true;
      return isSameDay(a.dateObj, targetDate);
  });

  return (
    <div className="px-4 sm:px-6 py-8 min-h-screen rounded-xl bg-[#FFFFFF]">
      
      {/* 1. Page Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2F1C]">Seller Dashboard</h1>
          <p className="text-gray-500">Welcome back</p>
        </div>
      </div>

      {/* --- ROW 1: Chart & Hero --- */}
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
                        <Link href="/seller/create-auction" className="inline-flex items-center gap-3 bg-white text-[#1A2F1C] font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group/btn">
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
                        <button onClick={() => setSelectedDate(undefined)} className="text-[10px] uppercase font-bold text-[#3A5A40] bg-[#E5F7CB] px-2 py-1 rounded-md hover:bg-[#3A5A40] hover:text-white transition-colors">
                            Reset to Today
                        </button>
                    )}
                </div>
                <Calendar 
                    mode="single"
                    selected={selectedDate || today} 
                    onSelect={setSelectedDate}
                    className="rounded-md border-none w-full" 
                    modifiers={{ active: activeDates, scheduled: scheduledDates, past: pastDates }}
                    modifiersClassNames={{
                        active: "bg-green-100 text-green-700 font-bold hover:bg-green-200 rounded-full",
                        scheduled: "bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 rounded-full",
                        past: "bg-gray-100 text-gray-400 line-through hover:bg-gray-200 rounded-full"
                    }}
                />
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
                        {isSameDay(targetDate, today) ? "Today's Auctions" : `Auctions on ${formatDateTitle(targetDate)}`}
                    </h2>
                </div>
                {!isSameDay(targetDate, today) && (
                    <Link href="/seller/history" className="text-sm font-semibold text-[#3A5A40] hover:text-[#2D4A2B] hover:underline">View History</Link>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 bg-white rounded-3xl border border-gray-100">
                    <p className="text-gray-500 animate-pulse">Loading dashboard data...</p>
                </div>
            ) : displayedAuctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedAuctions.map((auction, idx) => (
                        <AuctionCard 
                            key={idx}
                            id={`${auction.id.substring(0,7)}`}
                            type={auction.type} 
                            data={auction}
                            // --- CLICK HANDLER FOR MODAL ---
                            onViewClick={() => setSelectedAuction(auction)} 
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-white rounded-3xl border border-dashed border-gray-300 p-8 text-center">
                    <div className="w-16 h-16 bg-[#F5F7EB] rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="w-8 h-8 text-[#A3B18A]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Auctions Found</h3>
                    <p className="text-gray-500 max-w-sm">
                        You don't have any auctions for <span className="font-semibold text-[#3A5A40]">{formatDateTitle(targetDate)}</span>.
                    </p>
                    {targetDate >= today && (
                        <Link href="/seller/create-auction" className="mt-6 text-sm font-bold text-white bg-[#3A5A40] px-6 py-2.5 rounded-full hover:bg-[#2D4A2B] transition-colors">
                            Schedule New Auction
                        </Link>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL DISPLAY LOGIC --- */}
      {selectedAuction && selectedAuction.type === 'live' && (
        <LiveAuctionModal 
            auctionId={selectedAuction.id} 
            onClose={() => {
                setSelectedAuction(null);
                fetchAllData(); // Refresh list on close
            }}
        />
      )}

      {selectedAuction && selectedAuction.type === 'scheduled' && (
        <ScheduledAuctionModal 
            auctionId={selectedAuction.id} 
            onClose={() => {
                setSelectedAuction(null);
                fetchAllData(); // Refresh list on close
            }}
        />
      )}

      {selectedAuction && selectedAuction.type === 'history' && (
        <HistoryAuctionModal 
            auctionId={selectedAuction.id} 
            data={selectedAuction}
            onClose={() => setSelectedAuction(null)}
        />
      )}

    </div>
  );
}