"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import Next.js router
import { Package, X } from 'lucide-react';   // Import icons

export default function CreateAuctionPage() {
  const router = useRouter(); // Initialize router
  
  const [formData, setFormData] = useState({
    grade: '',
    quantity: '',
    origin: '',
    description: '',
    startingPrice: '',
    scheduledStart: '',
    duration: ''
  });

  const [showAIChat, setShowAIChat] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send data to your backend API
    alert('Auction created successfully!');
    
    // Redirect to dashboard using Next.js router
    router.push('/seller/dashboard'); 
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-[#1A2F1C] text-4xl font-bold text-center mb-12 animate-fade-in">
        Create Auction
      </h1>

      <div className="bg-white p-10 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Auction Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Tea & Quantity Details
            </h3>
            
            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="font-semibold text-gray-700">Tea Grade :</label>
              <select 
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="w-full max-w-xs bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all"
              >
                <option value="">Select Grade</option>
                <option value="BOPF">BOPF</option>
                <option value="Dust-1">Dust-1</option>
                <option value="Pekoe">Pekoe</option>
              </select>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="font-semibold text-gray-700">Quantity :</label>
              <div className="flex items-center max-w-xs">
                <input 
                  type="number" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-l-lg p-3 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all" 
                  placeholder="Enter quantity"
                />
                <span className="bg-[#588157] text-white px-4 py-3 rounded-r-lg font-bold">kg</span>
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="font-semibold text-gray-700">Origin :</label>
              <input 
                type="text" 
                value={formData.origin}
                onChange={(e) => setFormData({...formData, origin: e.target.value})}
                className="w-full max-w-xs bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all" 
                placeholder="e.g., Nuwara Eliya"
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
              <label className="font-semibold text-gray-700 mt-2">Description :</label>
              <textarea 
                rows={4} 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full max-w-md bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all"
                placeholder="Describe your tea's unique qualities..."
              ></textarea>
            </div>
          </div>

          <hr className="border-gray-300 my-8" />

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Pricing & Timing
            </h3>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="font-semibold text-gray-700">Starting Price :</label>
              <div className="flex items-center max-w-xs">
                <span className="bg-[#588157] text-white px-4 py-3 rounded-l-lg font-bold">$</span>
                <input 
                  type="number" 
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({...formData, startingPrice: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-r-lg p-3 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all" 
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="font-semibold text-gray-700">Scheduled Start :</label>
              <input 
                type="datetime-local" 
                value={formData.scheduledStart}
                onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
                className="max-w-xs bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-gray-700 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all" 
              />
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="font-semibold text-gray-700">Duration :</label>
              <div className="flex items-center max-w-xs">
                <input 
                  type="number" 
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-r-lg p-3 focus:ring-2 focus:ring-[#3A5A40] focus:border-transparent transition-all" 
                  placeholder="24"
                />
                <span className="bg-[#588157] text-white px-4 py-3 rounded-r-lg font-bold">hours</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button 
              type="submit" 
              className="bg-[#4F772D] hover:bg-[#3A5A40] text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
            >
              Create Auction
            </button>
            <button 
              type="button"
              onClick={() => router.push('/seller/dashboard')} // Changed from setActivePage
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg px-10 py-4 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}