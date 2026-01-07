"use client";
import React, { useEffect, useState } from 'react';
import { X, Package, Calendar, Clock, DollarSign, TrendingUp, User, AlertCircle, Ban } from 'lucide-react';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// 1. Helper for Input Field (Edit Mode)
const toLocalISOString = (dateString: string) => {
  if (!dateString) return '';
  const safeDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(safeDateString);
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 2. Helpers for Display Text (View Mode)
const formatDate = (isoString: string) => {
  if (!isoString) return 'N/A';
  const safeDateString = isoString.endsWith('Z') ? isoString : isoString + 'Z';
  return new Date(safeDateString).toLocaleDateString();
};

const formatTime = (isoString: string) => {
  if (!isoString) return 'N/A';
  const safeDateString = isoString.endsWith('Z') ? isoString : isoString + 'Z';
  return new Date(safeDateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// 3. Helper for Live Countdown
const calculateLiveCountdown = (startTime: string, durationHours: number) => {
  const safeStartTime = startTime.endsWith('Z') ? startTime : startTime + 'Z';
  const start = new Date(safeStartTime).getTime();
  const end = start + (durationHours * 60 * 60 * 1000);
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return "00:00:00";

  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ==========================================
// 1. SCHEDULED AUCTION MODAL
// ==========================================
export function ScheduledAuctionModal({ auctionId, onClose }: { auctionId: string; onClose: () => void }) {
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<'none' | 'details' | 'schedule'>('none');
  const [formData, setFormData] = useState({
    grade: '', quantity: 0, base_price: 0, origin: '', description: '', start_time: '', duration: 0
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/auctions/${auctionId}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setAuction(data);
        setFormData({
          grade: data.grade,
          quantity: data.quantity,
          base_price: data.base_price,
          origin: data.origin,
          description: data.description || '',
          start_time: toLocalISOString(data.start_time),
          duration: data.duration
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (auctionId) fetchDetails();
  }, [auctionId]);

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        seller_brand: auction.seller_brand || 'My Estate', 
        start_time: new Date(formData.start_time).toISOString(),
      };
      const res = await fetch(`http://localhost:8000/api/v1/auctions/${auctionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) { alert("Auction updated!"); setEditMode('none'); onClose(); }
    } catch (error) { alert("Update failed."); }
  };

  const handleCancelAuction = async () => {
    if (!confirm("Cancel this auction?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/auctions/${auctionId}`, { method: 'DELETE' });
      if (res.ok) { alert("Cancelled."); onClose(); }
    } catch (error) { alert("Cancel failed."); }
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-white p-6 rounded">Loading...</div></div>;
  if (!auction) return null;

  return (
    // FIX: Changed bg-black bg-opacity-50 -> bg-black/60 backdrop-blur-sm
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1A2F1C]">{auction.grade} - {auction.origin}</h2>
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">Scheduled</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-100 h-64 rounded-xl flex items-center justify-center border-2 border-gray-200">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Package className="w-5 h-5" /> Tea Details</h3>
                <div className="space-y-3 bg-[#F5F7EB] p-4 rounded-lg">
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Estate Name:</span>
                    <span className="text-gray-800 font-medium">{auction.seller_brand || "My Estate"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Grade:</span>
                    {editMode === 'details' ? (
                       <select value={formData.grade} onChange={(e) => setFormData({...formData, grade: e.target.value})} className="border p-1 rounded">
                         <option value="BOPF">BOPF</option><option value="Dust-1">Dust-1</option><option value="Pekoe">Pekoe</option>
                       </select>
                    ) : <span className="text-gray-800 font-medium">{auction.grade}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Quantity:</span>
                    {editMode === 'details' ? (
                       <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})} className="border p-1 rounded w-20" />
                    ) : <span className="text-gray-800 font-medium">{auction.quantity} kg</span>}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Origin:</span>
                    {editMode === 'details' ? (
                        <input type="text" value={formData.origin} onChange={(e) => setFormData({...formData, origin: e.target.value})} className="border p-1 rounded w-32" />
                    ) : <span className="text-gray-800 font-medium">{auction.origin}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-600">Base Price:</span>
                    {editMode === 'details' ? (
                       <input type="number" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})} className="border p-1 rounded w-20" />
                    ) : <span className="text-[#588157] font-bold text-xl">${auction.base_price}</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description:</h4>
                  {editMode === 'details' ? (
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border p-2 rounded" rows={3}/>
                  ) : <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{auction.description || "No description."}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4"><Calendar className="w-5 h-5" /> Schedule</h3>
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date:</span>
                    {editMode === 'schedule' ? <span className="text-xs text-blue-600 font-bold">(Edit below)</span> : <span>{formatDate(auction.start_time)}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-700 flex items-center gap-2"><Clock className="w-4 h-4" /> Time:</span>
                    {editMode === 'schedule' ? (
                        <input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="border p-1 rounded text-sm" />
                    ) : <span>{formatTime(auction.start_time)}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-700">Duration:</span>
                    {editMode === 'schedule' ? (
                        <input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseFloat(e.target.value)})} className="border p-1 rounded w-16" />
                    ) : <span>{auction.duration} hrs</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {editMode === 'none' ? (
                  <>
                    <button onClick={() => setEditMode('details')} className="w-full bg-[#588157] text-white font-bold py-3 rounded-lg hover:bg-[#3A5A40]">Edit Details</button>
                    <button onClick={() => setEditMode('schedule')} className="w-full bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600">Reschedule</button>
                    <button onClick={handleCancelAuction} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSave} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">Save Changes</button>
                    <button onClick={() => setEditMode('none')} className="w-full bg-gray-400 text-white font-bold py-3 rounded-lg hover:bg-gray-500">Discard</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. LIVE AUCTION MODAL (Connected to Backend)
// ==========================================
export function LiveAuctionModal({ auctionId, onClose }: { auctionId: string; onClose: () => void }) {
  const [auction, setAuction] = useState<any>(null);
  const [countdown, setCountdown] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Data
  useEffect(() => {
    const fetchLiveDetails = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/auctions/${auctionId}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setAuction(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (auctionId) fetchLiveDetails();
  }, [auctionId]);

  // 2. Live Timer Logic
  useEffect(() => {
    if (!auction) return;
    const timer = setInterval(() => {
        setCountdown(calculateLiveCountdown(auction.start_time, auction.duration));
    }, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-white p-6 rounded">Loading Live Data...</div></div>;
  if (!auction) return null;

  // 3. Determine Real Price & Buyer
  const currentPrice = auction.sold_price || auction.base_price;
  const currentBuyer = auction.buyer;

  return (
    // FIX: Changed bg-black bg-opacity-50 -> bg-black/60 backdrop-blur-sm
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1A2F1C]">{auction.grade} - {auction.origin}...</h2>
              <span className="animate-pulse bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">LIVE</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          {/* Countdown Banner */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-bold text-red-600">Auction Ending Soon!</p>
                <p className="text-sm text-red-500">Time Remaining</p>
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-red-600">{countdown}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Real Auction Info */}
            <div className="space-y-6">
              <div className="bg-gray-100 h-48 rounded-xl flex items-center justify-center border-2 border-gray-200">
                <Package className="w-20 h-20 text-gray-400" />
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 font-semibold">
                    {currentBuyer ? "Current Highest Bid" : "Starting Price"}
                  </span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-600 mb-2">${currentPrice}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{currentBuyer || "No Bids Yet"}</span>
                </div>
              </div>

              <div className="space-y-3 bg-[#F5F7EB] p-4 rounded-lg">
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Estate:</span>
                  <span className="text-gray-800 font-medium">{auction.seller_brand || "My Estate"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Grade:</span>
                  <span className="text-gray-800 font-medium">{auction.grade}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Quantity:</span>
                  <span className="text-gray-800 font-medium">{auction.quantity} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Origin:</span>
                  <span className="text-gray-800 font-medium">{auction.origin}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Base Price:</span>
                  <span className="text-gray-600 font-medium">${auction.base_price}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Start Time:</span>
                  <span className="font-medium">{formatTime(auction.start_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{auction.duration} Hours</span>
                </div>
              </div>
            </div>

            {/* Right Column - REAL Bidding Activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Live Bidding Activity
                </h3>
              </div>

              {/* LIST: Only show real data from DB */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {currentBuyer ? (
                  // SHOW CURRENT LEADING BID
                  <div className="p-4 rounded-lg bg-green-50 border-2 border-green-400 shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-800">{currentBuyer}</span>
                      </div>
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold">LEADING</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">${currentPrice}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Just now
                      </span>
                    </div>
                  </div>
                ) : (
                  // SHOW EMPTY STATE
                  <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-500 italic">No bids placed yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Waiting for buyers to join...</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 flex items-start gap-3 mt-4">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Auction in Progress</p>
                  <p className="text-xs">Bids update automatically when a buyer places a higher offer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. HISTORY AUCTION MODAL
// ==========================================
interface HistoryModalProps {
  auctionId: string;
  data: any; 
  onClose: () => void;
}

export function HistoryAuctionModal({ auctionId, data, onClose }: HistoryModalProps) {
  const modalDetails = {
    ...data,
    estateName: 'Premium Estate',
    origin: 'Ratnapura',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    soldTime: data.status === 'Sold' ? '11:58 AM' : null,
    winner: data.status === 'Sold' ? data.buyer : null,
  };

  const bidHistory = data.status === 'Sold' 
    ? [ { id: 1, buyer: data.buyer, time: '11:58 AM', amount: data.price, isWinning: true }, { id: 2, buyer: 'TeaMaster Ltd', time: '11:55 AM', amount: data.price - 25 }, { id: 3, buyer: 'Ceylon Traders', time: '11:50 AM', amount: data.price - 50 }, { id: 4, buyer: 'Global Teas PLC', time: '11:45 AM', amount: data.price - 75 }, { id: 5, buyer: 'Premium Tea Co', time: '11:40 AM', amount: data.price - 100 } ]
    : [ { id: 1, buyer: 'TeaMaster Ltd', time: '11:55 AM', amount: data.price - 100, isWinning: false }, { id: 2, buyer: 'Ceylon Traders', time: '11:50 AM', amount: data.price - 150, isWinning: false } ]; 

  return (
    // FIX: Changed bg-black bg-opacity-50 -> bg-black/60 backdrop-blur-sm
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1A2F1C]">{auctionId}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${modalDetails.status === 'Sold' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{modalDetails.status}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-100 h-48 rounded-xl flex items-center justify-center border-2 border-gray-200">
                <Package className="w-20 h-20 text-gray-400" />
              </div>

              {modalDetails.status === 'Sold' ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-500 rounded-full p-2"><User className="w-5 h-5 text-white" /></div>
                    <span className="font-bold text-gray-700">Winning Buyer</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mb-3">{modalDetails.winner}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">Final Price:</span>
                    <span className="text-3xl font-bold text-green-600">${modalDetails.price}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Sold at:</span><span className="font-medium">{modalDetails.soldTime}</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-red-500 rounded-full p-2"><Ban className="w-5 h-5 text-white" /></div>
                    <span className="font-bold text-red-800">Lot Not Sold</span>
                  </div>
                  <p className="text-sm text-red-700 mb-3">Reserve price was not met. This item has been moved to the catalogue for private sale.</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="text-2xl font-bold text-gray-500">${modalDetails.price}</span>
                  </div>
                </div>
              )}

              <div className="space-y-3 bg-[#F5F7EB] p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Auction Details</h3>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Grade:</span><span className="text-gray-800 font-medium">{modalDetails.grade}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Quantity:</span><span className="text-gray-800 font-medium">{modalDetails.quantity} kg</span></div>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Origin:</span><span className="text-gray-800 font-medium">{modalDetails.origin}</span></div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Auction Timeline</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Start Time:</span><span className="font-medium">{modalDetails.startTime}</span></div>
                  <div className="flex justify-between"><span>End Time:</span><span className="font-medium">{modalDetails.endTime}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><DollarSign className="w-5 h-5" /> {modalDetails.status === 'Sold' ? 'Winning Bid History' : 'Bids Received'}</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {bidHistory.map((bid, index) => (
                  <div key={bid.id} className={`p-4 rounded-lg transition-all ${bid.isWinning ? 'bg-green-50 border-2 border-green-400 shadow-lg' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-gray-500">#{index + 1}</span><User className="w-4 h-4 text-gray-600" /><span className="font-semibold text-gray-800">{bid.buyer}</span></div>
                        {bid.isWinning && <span className="inline-block bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">WINNING BID</span>}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {bid.time}</span>
                    </div>
                    <div className={`text-2xl font-bold ${bid.isWinning ? 'text-green-600' : 'text-gray-700'}`}>${bid.amount}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t-2 border-gray-200">
                {modalDetails.status === 'Sold' ? (
                  <button className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md">Download Invoice</button>
                ) : (
                  <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md">Relist Item</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}