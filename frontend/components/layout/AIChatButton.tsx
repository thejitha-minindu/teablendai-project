"use client";
import React, { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* --- Floating Button (Updated for Round Elegance) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 bg-white group hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-[0_0_25px_rgba(138,168,72,0.6)] rounded-full w-20 h-20 flex flex-col items-center justify-center border-[3px] border-[#8AA848]"
      >
        {/* Subtle Ping Animation behind text */}
        <div className="absolute inset-0 bg-[#8AA848]/10 rounded-full animate-ping opacity-75 group-hover:animate-none" />
        
        {/* Text Stack - Matches Figma Design exactly */}
        <div className="relative z-10 flex flex-col items-center leading-none text-[#4F772D] font-bold">
          <span className="text-[10px] tracking-wide mb-0.5">ASK</span>
          <span className="text-xl">AI</span>
        </div>
      </button>

      {/* --- Chat Window Popup (Unchanged logic, slight visual polish) --- */}
      {isOpen && (
        <div className="fixed bottom-32 right-8 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-[#8AA848]/30 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-[#F5F7EB] p-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-[#4F772D] p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-[#1A2F1C]">TeaBlend AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors bg-white/50 rounded-full p-1 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-white h-72 overflow-y-auto">
            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none mb-4 text-sm text-gray-600 leading-relaxed border border-gray-100 shadow-sm">
              <p className="font-semibold text-[#4F772D] mb-1">Hello Seller! 👋</p>
              I can help you with:
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Analyzing current market prices</li>
                <li>Predicting auction trends</li>
                <li>Optimizing your catalogue</li>
              </ul>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask about prices..."
                className="w-full bg-white border border-gray-200 rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#8AA848] focus:border-transparent outline-none shadow-sm transition-all"
              />
              <button className="absolute right-2 top-2 p-1.5 bg-[#4F772D] rounded-full text-white hover:bg-[#3A5A40] transition-colors shadow-md">
                <Send className="w-4 h-4 pl-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}