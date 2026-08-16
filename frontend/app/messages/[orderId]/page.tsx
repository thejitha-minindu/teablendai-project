"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  RotateCw,
  Package,
  CheckCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { getAuthClaims } from '@/lib/auth';
import { useOrderMessages } from '@/hooks/use-order-messages';
import { apiClient } from '@/lib/apiClient';

interface OrderChatInfo {
  order_id: string;
  user_id: string;   // buyer's user_id
  buyer_name: string;
  seller_name: string;
  estate_name?: string;
  grade?: string;
  quantity?: number;
  total_amount?: number;
  status?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [currentUserId, setCurrentUserId] = useState('');
  const [orderInfo, setOrderInfo] = useState<OrderChatInfo | null>(null);
  const [counterpartyName, setCounterpartyName] = useState('Loading...');
  const [isBuyer, setIsBuyer] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read current user from JWT
  useEffect(() => {
    const claims = getAuthClaims();
    if (claims?.id) setCurrentUserId(claims.id);
  }, []);

  // Fetch enriched order info (buyer + seller names, estate, amount)
  useEffect(() => {
    if (!orderId) return;
    apiClient.get(`/messages/order/${orderId}/info`)
      .then(res => {
        const info: OrderChatInfo = res.data;
        setOrderInfo(info);
        const buyerCheck = String(info.user_id).toLowerCase() === String(currentUserId).toLowerCase();
        setIsBuyer(buyerCheck);
        setCounterpartyName(buyerCheck ? (info.seller_name || info.estate_name || 'Seller') : info.buyer_name);
      })
      .catch(err => {
        console.error('Failed to load chat info:', err);
        setCounterpartyName('Tea Trader');
      });
  }, [orderId, currentUserId]);

  const {
    messages,
    connected,
    isReconnecting,
    isLoading,
    sendMessage,
    reconnect
  } = useOrderMessages(orderId, currentUserId);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await sendMessage(text);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setNewMessage(prompt);
    inputRef.current?.focus();
  };

  const quickPrompts = isBuyer
    ? [
        "Hi! When will this batch be dispatched?",
        "Could you please provide the shipping tracking number?",
        "Is the packaging sealed for moisture protection?"
      ]
    : [
        "Hello! Your tea order has been prepared for dispatch.",
        "The batch will be handed to the courier tomorrow morning.",
        "Quality check certificate has been attached with the shipment."
      ];

  return (
    <div className="flex flex-col h-screen bg-[#f3f6f4] max-w-4xl mx-auto border-x border-emerald-950/10 shadow-2xl overflow-hidden font-sans">

      {/* --- PREMIUM CHAT HEADER --- */}
      <header className="bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-emerald-900/10 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-1 hover:bg-emerald-50 text-gray-600 hover:text-emerald-800 rounded-full transition-all duration-200"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar with Status Pulse */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2D6A4F] to-[#52B788] flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
              {counterpartyName && counterpartyName !== 'Loading...'
                ? counterpartyName.charAt(0).toUpperCase()
                : <User className="w-5 h-5 text-white" />}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition-colors duration-300 ${
                connected ? 'bg-emerald-500 ring-1 ring-emerald-300' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Counterpart Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {counterpartyName}
              </h1>
              <span title="Verified Trader" className="inline-flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                #{orderId ? orderId.slice(0, 8).toUpperCase() : ''}
              </span>
              {orderInfo?.estate_name && (
                <span className="hidden sm:inline-block truncate text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  🍃 {orderInfo.estate_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Live Status Pill */}
        <div className="flex items-center gap-2">
          {/* Interactive Live Badge with Reconnect Action */}
          <button
            onClick={reconnect}
            title={connected ? "Real-time live socket active. Click to refresh." : "Connecting to live socket. Click to reconnect now."}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 select-none shadow-2xs cursor-pointer ${
              connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300'
                : isReconnecting
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {connected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold tracking-wide uppercase text-[10px]">Live</span>
              </>
            ) : isReconnecting ? (
              <>
                <RotateCw className="w-3 h-3 text-amber-600 animate-spin" />
                <span className="text-[11px]">Connecting</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-gray-400 group-hover:text-emerald-700 transition-colors" />
                <span className="group-hover:text-emerald-700 text-[11px]">Syncing</span>
                <RotateCw className="w-2.5 h-2.5 ml-0.5 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-300" />
              </>
            )}
          </button>

          {/* Toggle Order Details Button */}
          {orderInfo && (
            <button
              onClick={() => setShowOrderDetails(!showOrderDetails)}
              className={`p-2 rounded-full transition-colors ${
                showOrderDetails ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Order Details"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* --- COLLAPSIBLE ORDER DETAILS DRAWER --- */}
      {showOrderDetails && orderInfo && (
        <div className="bg-emerald-900 text-white px-5 py-3 border-b border-emerald-800 flex flex-wrap items-center justify-between gap-4 text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">Estate</span>
              <span className="font-semibold text-sm">{orderInfo.estate_name || 'Direct Auction'}</span>
            </div>
            {orderInfo.grade && (
              <div>
                <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">Grade</span>
                <span className="font-semibold text-sm">{orderInfo.grade}</span>
              </div>
            )}
            {orderInfo.quantity && (
              <div>
                <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">Quantity</span>
                <span className="font-semibold text-sm">{orderInfo.quantity} kg</span>
              </div>
            )}
            {orderInfo.total_amount && (
              <div>
                <span className="text-emerald-300 block text-[10px] uppercase font-bold tracking-wider">Amount</span>
                <span className="font-semibold text-sm font-mono text-emerald-200">
                  LKR {orderInfo.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-emerald-800 text-emerald-200 border border-emerald-700">
              {orderInfo.status || 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* --- MESSAGES CANVAS --- */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-gradient-to-b from-[#f5f8f5] via-[#f8faf8] to-[#edf3ed]">
        {/* Safe Transaction Banner */}
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-xs border border-emerald-900/10 rounded-full px-4 py-1 text-[11px] text-gray-500 font-medium flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-end verified trading conversation for Order #{orderId ? orderId.slice(0, 8).toUpperCase() : ''}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2D6A4F] border-t-transparent shadow-xs" />
            <p className="text-xs font-medium text-gray-500">Loading tea conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mb-4 text-[#2D6A4F] shadow-sm border border-emerald-200/60">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Direct Order Message Channel</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              Connect directly with {counterpartyName} regarding delivery schedules, logistics, packaging, and order inquiries.
            </p>

            {/* Quick Starter Prompts */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suggested Questions</span>
              </div>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="w-full text-left text-xs bg-white hover:bg-emerald-50/80 text-gray-700 hover:text-emerald-900 p-2.5 rounded-xl border border-emerald-900/10 transition-all duration-150 flex items-center justify-between group shadow-2xs hover:shadow-xs"
                >
                  <span>{prompt}</span>
                  <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id).toLowerCase() === String(currentUserId).toLowerCase();
            const time = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={msg.message_id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold shrink-0 mb-1 border border-emerald-200">
                    {counterpartyName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-xs transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white rounded-br-xs'
                      : 'bg-white text-gray-800 border border-emerald-900/10 rounded-bl-xs'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span
                      className={`text-[10px] font-medium ${
                        isMe ? 'text-emerald-200/90' : 'text-gray-400'
                      }`}
                    >
                      {time}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- STYLISH INPUT AREA --- */}
      <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 border-t border-emerald-900/10 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${counterpartyName}...`}
              className="w-full bg-[#f4f7f4] border border-emerald-900/10 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] text-white p-3 rounded-2xl hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md flex items-center justify-center shrink-0 cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
