"use client";
import React, { useEffect, useState } from 'react';
import { X, Package, Calendar, Clock, DollarSign, TrendingUp, User, AlertCircle, Ban } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { useAuctionBidsSocket } from '@/hooks/live-auction-socket';
import { toast } from 'sonner';

// ==========================================
// HELPER FUNCTIONS
// ==========================================
import { parseBackendDateTime, calculateLiveCountdown, durationToMinutes } from "@/utils/dateFormatter";

const formatDateTimeLocalValue = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatStartTimeForBackend = (localDateTime: string) => {
  if (!localDateTime) return '';
  // localDateTime is in format: YYYY-MM-DDTHH:MM (from datetime-local input)
  // This represents the user's local time, preserve it with timezone offset
  const date = new Date(localDateTime);

  // Get timezone offset and format as ISO string with offset
  // e.g., "2026-03-29T16:00:00+05:30"
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = '00';

  const offset = date.getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMinutes = pad(Math.abs(offset % 60));
  const offsetSign = offset <= 0 ? '+' : '-';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
};

const durationToHoursForInput = (durationValue: number) => {
  if (!Number.isFinite(durationValue) || durationValue <= 0) return 0;
  return durationValue > 24 ? durationValue / 60 : durationValue;
};

const formatDuration = (durationValue: number) => {
  const totalMinutes = Math.round(durationToMinutes(durationValue));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  if (hours === 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

// 1. Helper for Input Field (Edit Mode)
const toLocalISOString = (dateString: string) => {
  if (!dateString) return '';
  const date = parseBackendDateTime(dateString);
  if (!date || Number.isNaN(date.getTime())) return '';
  return formatDateTimeLocalValue(date);
};

// 2. Helpers for Display Text (View Mode)
const formatDate = (isoString: string) => {
  if (!isoString) return 'N/A';
  const date = parseBackendDateTime(isoString);
  if (!date || Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const formatTime = (isoString: string) => {
  if (!isoString) return 'N/A';
  const date = parseBackendDateTime(isoString);
  if (!date || Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ==========================================
// 1. SCHEDULED AUCTION MODAL
// ==========================================
export function ScheduledAuctionModal({ auctionId, onClose }: { auctionId: string; onClose: () => void }) {
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<'none' | 'details' | 'schedule'>('none');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    grade: '', quantity: 0, base_price: 0, origin: '', description: '', start_time: '', duration: 0, estate_name: ''
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(`/auctions/${auctionId}`);
        const data = res.data;
        setAuction(data);
        setFormData({
          grade: data.grade,
          quantity: data.quantity,
          base_price: data.base_price,
          origin: data.origin,
          description: data.description || '',
          start_time: toLocalISOString(data.start_time),
          duration: durationToHoursForInput(data.duration),
          estate_name: data.estate_name || ''
        });
        setImagePreview(data.image_url || '');
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
      let finalImageUrl = auction.image_url;

      // Upload newly selected image if it exists
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);
        const uploadRes = await apiClient.post('/auctions/upload-image', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.image_url;
      }

      const payload = {
        ...formData,
        seller_brand: auction.seller_brand || 'My Estate',
        start_time: formatStartTimeForBackend(formData.start_time),
        duration: Math.round(formData.duration * 60),
        image_url: finalImageUrl || undefined
      };
      await apiClient.put(`/auctions/${auctionId}`, payload);
      toast.success("Auction updated!");
      setEditMode('none');
      onClose();
    } catch (error) { toast.error("Update failed."); }
  };

  const handleCancelAuction = async () => {
    if (!confirm("Cancel this auction?")) return;
    try {
      await apiClient.delete(`/auctions/${auctionId}`);
      toast.success("Cancelled.");
      onClose();
    } catch (error) { toast.error("Cancel failed."); }
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
              <div className="bg-gray-50 h-64 rounded-xl flex items-center justify-center border-2 border-gray-200 overflow-hidden relative group">
                {editMode === 'details' ? (
                  <label htmlFor="details-dropzone" className="flex flex-col items-center justify-center w-full h-full cursor-pointer bg-white hover:bg-gray-100 transition-colors">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <span className="bg-white/90 text-gray-800 text-sm font-bold px-4 py-2 rounded-full shadow-lg border border-gray-200 top-2/4">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-500">
                        <Package className="w-10 h-10 mb-2 opacity-50 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-600">Click to upload image</span>
                      </div>
                    )}
                    <input 
                      id="details-dropzone" 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                ) : imagePreview || auction.image_url ? (
                  <img src={imagePreview || auction.image_url} alt="Tea Image" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                ) : (
                  <Package className="w-24 h-24 text-gray-300 drop-shadow-sm" />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Package className="w-5 h-5" /> Tea Details</h3>
                <div className="space-y-3 bg-[#F5F7EB] p-4 rounded-lg">
                  <div className="flex justify-between py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Ref ID:</span>
                    <span className="text-gray-800 font-medium">{auction.custom_auction_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Estate Name:</span>
                    {editMode === 'details' ? (
                      <input type="text" value={formData.estate_name} onChange={(e) => setFormData({ ...formData, estate_name: e.target.value })} className="border p-1 rounded w-40" />
                    ) : <span className="text-gray-800 font-medium">{auction.estate_name || "My Estate"}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Grade:</span>
                    {editMode === 'details' ? (
                      <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="border p-1 rounded">
                        <option value="BOPF">BOPF</option><option value="Dust-1">Dust-1</option><option value="Pekoe">Pekoe</option>
                      </select>
                    ) : <span className="text-gray-800 font-medium">{auction.grade}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Quantity:</span>
                    {editMode === 'details' ? (
                      <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })} className="border p-1 rounded w-20" />
                    ) : <span className="text-gray-800 font-medium">{auction.quantity} kg</span>}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="font-semibold text-gray-600">Origin:</span>
                    {editMode === 'details' ? (
                      <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="border p-1 rounded w-32" />
                    ) : <span className="text-gray-800 font-medium">{auction.origin}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-600">Base Price:</span>
                    {editMode === 'details' ? (
                      <input type="number" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })} className="border p-1 rounded w-20" />
                    ) : <span className="text-[#588157] font-bold text-xl">LKR {auction.base_price}</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description:</h4>
                  {editMode === 'details' ? (
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border p-2 rounded" rows={3} />
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
                      <input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="border p-1 rounded text-sm" />
                    ) : <span>{formatTime(auction.start_time)}</span>}
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold text-gray-700">Duration:</span>
                    {editMode === 'schedule' ? (
                      <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })} className="border p-1 rounded w-16" />
                    ) : <span>{formatDuration(auction.duration)}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-gray-100">
                {editMode === 'none' ? (
                  <>
                    <Button onClick={() => setEditMode('details')} className="w-full bg-[#3A5A40] text-white font-bold py-6 rounded-xl shadow-md transition-all duration-300 hover:bg-[#1A2F1C] border border-[#3A5A40] text-md tracking-wide">
                      Edit Details
                    </Button>
                    <Button onClick={() => setEditMode('schedule')} variant="outline" className="w-full border-2 border-[#3A5A40] text-[#3A5A40] font-bold py-6 rounded-xl shadow-sm transition-all duration-300 hover:bg-[#E5F7CB] text-md tracking-wide">
                      Reschedule
                    </Button>
                    <Button onClick={handleCancelAuction} variant="ghost" className="w-full text-red-500 font-bold py-6 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-300 border-2 border-transparent hover:border-red-100 text-md tracking-wide">
                      Delete Auction
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleSave} className="w-full bg-[#588157] text-white font-bold py-6 rounded-xl shadow-md transition-all duration-300 hover:bg-[#3A5A40] text-md tracking-wide">
                      Save Changes
                    </Button>
                    <Button onClick={() => setEditMode('none')} variant="outline" className="w-full border-2 border-gray-300 text-gray-500 font-bold py-6 rounded-xl transition-all duration-300 hover:bg-gray-100 hover:text-gray-700 text-md tracking-wide">
                      Discard
                    </Button>
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
// 2. LIVE AUCTION MODAL (Connected to Backend & WebSockets)
// ==========================================

export function LiveAuctionModal({ auctionId, onClose }: { auctionId: string; onClose: () => void }) {
  const [auction, setAuction] = useState<any>(null);
  const [countdown, setCountdown] = useState("Loading...");
  const [loading, setLoading] = useState(true);
  const [historicalBids, setHistoricalBids] = useState<any[]>([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);

  // --- CONNECT TO WEBSOCKET ---
  const { connected, events } = useAuctionBidsSocket(auctionId);

  // 1. Fetch Real Initial Data
  useEffect(() => {
    const fetchLiveDetails = async () => {
      try {
        const res = await apiClient.get(`/auctions/${auctionId}`);
        setAuction(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (auctionId) fetchLiveDetails();
  }, [auctionId]);

  useEffect(() => {
    const fetchHistoricalBids = async () => {
      try {
        setIsLoadingBids(true);
        const res = await apiClient.get(`/buyer/bids/auction/${auctionId}/bids`);
        const bidsArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const sorted = [...bidsArray].sort(
          (a, b) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime()
        );
        setHistoricalBids(sorted);
      } catch (error) {
        console.error("Failed to fetch historical bids:", error);
      } finally {
        setIsLoadingBids(false);
      }
    };
    if (auctionId) fetchHistoricalBids();
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

  // 3. Determine Real-Time Price & Buyer
  // If we have WS events, use the newest event. Otherwise, fall back to DB data.
  // 3. Determine Real-Time Price & Buyer
  const latestWsBid = events.length > 0 ? events[0].data : null;
  const latestHistBid = historicalBids.length > 0 ? historicalBids[0] : null;

  const currentPrice = latestWsBid?.bid_amount
    ?? latestHistBid?.bid_amount
    ?? auction.highest_bid
    ?? auction.sold_price
    ?? auction.base_price;

  // Prioritize buyer_name over buyer_id
  const rawBuyer = latestWsBid?.buyer_name ?? latestWsBid?.buyer_id
    ?? latestHistBid?.buyer_name ?? latestHistBid?.buyer_id
    ?? auction.highest_bidder
    ?? auction.buyer;

  // Format name safely without cutting off short names
  const safeBuyerDisplay = isLoadingBids
    ? "Loading bids..."
    : rawBuyer
    ? (rawBuyer.includes('@') ? rawBuyer.split('@')[0] : (rawBuyer.length > 20 ? rawBuyer.substring(0, 20) + "..." : rawBuyer))
    : "Waiting for bids...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1A2F1C]">{auction.grade} - {auction.origin}</h2>
              <span className="animate-pulse bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                LIVE {connected && <div className="w-2 h-2 bg-white rounded-full animate-bounce" />}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          {/* Countdown Banner */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-bold text-red-600">Auction in Progress</p>
                <p className="text-sm text-red-500">Time Remaining</p>
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-red-600">{countdown}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Real Auction Info */}
            <div className="space-y-6">

              {/* Conditional Image Display for Live */}
              {auction.image_url && (
                  <div className="bg-gray-50 h-48 rounded-xl flex items-center justify-center border-2 border-gray-200 overflow-hidden relative shadow-sm">
                    <img src={auction.image_url} alt="Tea Image" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                  </div>
              )}

              <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 shadow-inner transition-colors duration-500">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 font-semibold uppercase tracking-wider text-sm">
                    {rawBuyer ? "Current Highest Bid" : "Starting Price"}
                  </span>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-5xl font-bold text-green-700 mb-3">LKR {currentPrice}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/60 w-max px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{safeBuyerDisplay}</span>
                </div>
              </div>

              <div className="space-y-3 bg-[#F5F7EB] p-4 rounded-lg">
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Ref ID:</span>
                  <span className="text-gray-800 font-medium">{auction.custom_auction_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300">
                  <span className="font-semibold text-gray-600">Estate:</span>
                  <span className="text-gray-800 font-medium">{auction.estate_name || "My Estate"}</span>
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
                  <span className="text-gray-600 font-medium">LKR {auction.base_price}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Start Time:</span>
                  <span className="font-medium">{formatTime(auction.start_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{formatDuration(auction.duration)}</span>
                </div>
              </div>
            </div>

            {/* Right Column - REAL Bidding Activity */}
            <div className="space-y-4 flex flex-col h-full">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Live Activity Feed
              </h3>

              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[400px] space-y-3 shadow-inner">

                {/* Render WebSocket Events if present */}
                {events.length > 0 ? (
                  events.map((evt, idx) => {
                    const wsBuyer = evt.data.buyer_name || evt.data.buyer_id || "";
                    const safeWsBuyer = wsBuyer.includes('@') ? wsBuyer.split('@')[0] : (wsBuyer.length > 20 ? wsBuyer.substring(0, 20) + "..." : wsBuyer);

                    return (
                      <div key={evt.event_id} className={`p-4 rounded-lg transition-all duration-500 animate-slide-in-right ${idx === 0 ? 'bg-green-100 border-2 border-green-500 shadow-md' : 'bg-white border border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className={`w-4 h-4 ${idx === 0 ? 'text-green-700' : 'text-gray-500'}`} />
                            <span className={`font-semibold ${idx === 0 ? 'text-green-800' : 'text-gray-700'}`}>
                              {safeWsBuyer}
                            </span>
                          </div>
                          {idx === 0 && <span className="bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-bold tracking-widest">NEW LEADER</span>}
                        </div>
                        <div className="flex justify-between items-end">
                          <span className={`text-2xl font-bold ${idx === 0 ? 'text-green-700' : 'text-gray-800'}`}>LKR {evt.data.bid_amount}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(evt.occurred_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : historicalBids.length > 0 ? (
                  /* Render Database History if no new WS events yet */
                  historicalBids.map((bid, idx) => {
                    const histBuyer = bid.buyer_name || bid.buyer_id || "";
                    const safeHistBuyer = histBuyer.includes('@') ? histBuyer.split('@')[0] : (histBuyer.length > 20 ? histBuyer.substring(0, 20) + "..." : histBuyer);

                    return (
                      <div key={bid.bid_id ?? idx} className={`p-4 rounded-lg transition-all ${idx === 0 ? 'bg-green-100 border-2 border-green-500 shadow-md' : 'bg-white border border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className={`w-4 h-4 ${idx === 0 ? 'text-green-700' : 'text-gray-500'}`} />
                            <span className={`font-semibold ${idx === 0 ? 'text-green-800' : 'text-gray-700'}`}>
                              {safeHistBuyer}
                            </span>
                          </div>
                          {idx === 0 && <span className="bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">CURRENT LEADER</span>}
                        </div>
                        <div className="flex justify-between items-end">
                          <span className={`text-2xl font-bold ${idx === 0 ? 'text-green-700' : 'text-gray-800'}`}>
                            LKR {bid.bid_amount}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(bid.bid_time).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : isLoadingBids ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10 animate-pulse">
                    <Clock className="w-8 h-8 mb-2 opacity-50 animate-spin" />
                    <p className="font-semibold">Loading Live Bids...</p>
                  </div>
                ) : (
                  /* No bids anywhere */
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-10">
                    <Clock className="w-8 h-8 mb-2 opacity-50" />
                    <p className="italic">No bids placed yet.</p>
                    <p className="text-xs mt-1">Updates will appear here instantly.</p>
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

// ==========================================
// 3. HISTORY AUCTION MODAL (Connected to Real Backend)
// ==========================================

interface HistoryModalProps {
  auctionId: string;
  data: any;
  onClose: () => void;
}

export function HistoryAuctionModal({ auctionId, data, onClose }: HistoryModalProps) {
  const [auctionDetails, setAuctionDetails] = useState<any>(data);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        // 1. Fetch fresh auction details
        const auctionRes = await apiClient.get(`/auctions/${auctionId}`);
        setAuctionDetails(auctionRes.data);

        // 2. Fetch the real bid history
        const bidsRes = await apiClient.get(`/buyer/bids/auction/${auctionId}/bids`);

        // Handle FastAPI array response safely
        const bidsArray = Array.isArray(bidsRes.data) ? bidsRes.data : (bidsRes.data?.data || []);

        // Sort bids by amount (highest first) so the winner is always at index 0
        const sortedBids = [...bidsArray].sort((a, b) => b.bid_amount - a.bid_amount);
        setBidHistory(sortedBids);
      } catch (error) {
        console.error("Failed to load auction history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) fetchHistoryData();
  }, [auctionId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#3A5A40] border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-gray-700">Loading historical records...</span>
        </div>
      </div>
    );
  }

  if (!auctionDetails) return null;

  // Process display data dynamically based on whether any bids were placed
  const isSold = auctionDetails.status?.toLowerCase() === 'sold' || auctionDetails.buyer || bidHistory.length > 0;
  const displayStatus = isSold ? 'Sold' : 'Unsold';

  const highestBid = bidHistory.length > 0 ? bidHistory[0] : null;
  const finalPrice = highestBid ? highestBid.bid_amount : (auctionDetails.sold_price || auctionDetails.base_price);

  // Format the winner's name safely
  const rawWinnerId = highestBid ? (highestBid.buyer_name || highestBid.buyer_id) : (auctionDetails.buyer_name || auctionDetails.buyer);
  const winnerDisplay = rawWinnerId ? (rawWinnerId.includes('@') ? rawWinnerId.split('@')[0] : (rawWinnerId.length > 20 ? rawWinnerId.substring(0, 20) + "..." : rawWinnerId)) : "Unknown";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">

          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1A2F1C]">{auctionDetails.grade} - {auctionDetails.origin}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${isSold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {displayStatus}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 h-48 rounded-xl flex items-center justify-center border-2 border-gray-200 overflow-hidden relative">
                {auctionDetails.image_url ? (
                  <img src={auctionDetails.image_url} alt="Tea Image" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                ) : (
                  <Package className="w-20 h-20 text-gray-300 drop-shadow-sm" />
                )}
              </div>

              {/* Dynamic Sold / Unsold Banner */}
              {isSold ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-5 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-500 rounded-full p-2"><User className="w-5 h-5 text-white" /></div>
                    <span className="font-bold text-gray-700">Winning Buyer</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mb-3">{winnerDisplay}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">Final Price:</span>
                    <span className="text-3xl font-bold text-green-600">LKR {finalPrice}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Sold at:</span>
                      <span className="font-medium">{highestBid ? formatTime(highestBid.bid_time) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-red-500 rounded-full p-2"><Ban className="w-5 h-5 text-white" /></div>
                    <span className="font-bold text-red-800">Lot Not Sold</span>
                  </div>
                  <p className="text-sm text-red-700 mb-3">No bids were placed. This item has been moved to history.</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="text-2xl font-bold text-gray-500">LKR {auctionDetails.base_price}</span>
                  </div>
                </div>
              )}

              {/* Auction Details */}
              <div className="space-y-3 bg-[#F5F7EB] p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Auction Details</h3>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Ref ID:</span><span className="text-gray-800 font-medium">{auctionDetails.custom_auction_id || 'N/A'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Estate Name:</span><span className="text-gray-800 font-medium">{auctionDetails.estate_name || "My Estate"}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Grade:</span><span className="text-gray-800 font-medium">{auctionDetails.grade}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Quantity:</span><span className="text-gray-800 font-medium">{auctionDetails.quantity} kg</span></div>
                <div className="flex justify-between py-2 border-b border-gray-300"><span className="font-semibold text-gray-600">Origin:</span><span className="text-gray-800 font-medium">{auctionDetails.origin}</span></div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Auction Timeline</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Start Time:</span><span className="font-medium">{formatTime(auctionDetails.start_time)}</span></div>
                  <div className="flex justify-between"><span>Duration:</span><span className="font-medium">{formatDuration(auctionDetails.duration)}</span></div>
                </div>
              </div>
            </div>

            {/* Right Column: Bid History */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> {isSold ? 'Winning Bid History' : 'Bids Received'}
              </h3>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {bidHistory.length > 0 ? (
                  bidHistory.map((bid, index) => {
                    const isWinningBid = index === 0 && isSold;
                    const buyerDisplay = bid.buyer_name || bid.buyer_id;
                    const safeBuyer = buyerDisplay.includes('@') ? buyerDisplay.split('@')[0] : (buyerDisplay.length > 20 ? buyerDisplay.substring(0, 20) + "..." : buyerDisplay);

                    return (
                      <div key={bid.bid_id} className={`p-4 rounded-lg transition-all ${isWinningBid ? 'bg-green-50 border-2 border-green-400 shadow-lg' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-500">#{bidHistory.length - index}</span>
                              <User className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-gray-800">{safeBuyer}</span>
                            </div>
                            {isWinningBid && <span className="inline-block bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">WINNING BID</span>}
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(bid.bid_time)}
                          </span>
                        </div>
                        <div className={`text-2xl font-bold ${isWinningBid ? 'text-green-600' : 'text-gray-700'}`}>
                          LKR {bid.bid_amount}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <p className="italic">No bids were placed during this auction.</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-4 border-t-2 border-gray-100">
                {isSold ? (
                  <Button className="w-full bg-[#3A5A40] text-white font-bold py-6 rounded-xl shadow-md transition-all duration-300 hover:bg-[#1A2F1C] border border-[#3A5A40] text-md tracking-wide">
                    Download Invoice
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-2 border-[#3A5A40] text-[#3A5A40] font-bold py-6 rounded-xl shadow-sm transition-all duration-300 hover:bg-[#E5F7CB] text-md tracking-wide">
                    Relist Item
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}