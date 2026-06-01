"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, MoreVertical, ShieldCheck, User, Wifi, WifiOff } from 'lucide-react';
import { getAuthClaims } from '@/lib/auth';
import { useOrderMessages } from '@/hooks/use-order-messages';
import { apiClient } from '@/lib/apiClient';

interface OrderChatInfo {
  order_id: string;
  user_id: string;   // buyer's user_id
  buyer_name: string;
  seller_name: string;
  estate_name?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [currentUserId, setCurrentUserId] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('Loading...');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read current user from JWT
  useEffect(() => {
    const claims = getAuthClaims();
    if (claims?.id) setCurrentUserId(claims.id);
  }, []);

  // Fetch enriched order info (buyer + seller names) from the dedicated endpoint
  useEffect(() => {
    if (!orderId) return;
    apiClient.get(`/messages/order/${orderId}/info`)
      .then(res => {
        const info: OrderChatInfo = res.data;
        // Determine who the other party is based on the current user
        const isBuyer = String(info.user_id) === String(currentUserId);
        setCounterpartyName(isBuyer ? (info.seller_name || info.estate_name || 'Seller') : info.buyer_name);
      })
      .catch(err => {
        console.error('Failed to load chat info:', err);
        setCounterpartyName('Unknown');
      });
  }, [orderId, currentUserId]);


  const { messages, connected, isLoading, sendMessage } = useOrderMessages(orderId, currentUserId);

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
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-4xl mx-auto border-x border-gray-200 shadow-xl">

      {/* --- CHAT HEADER --- */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
              <User className="w-6 h-6 text-green-700" />
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>

          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-1">
              {counterpartyName} <ShieldCheck className="w-3 h-3 text-blue-500" />
            </h2>
            <p className="text-xs text-gray-500">
              Order #{orderId?.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
              <WifiOff className="w-3 h-3" /> Polling
            </span>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]/10">
        {/* Date Divider */}
        <div className="flex justify-center my-4">
          <span className="bg-gray-200 text-gray-600 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide">
            Messages
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id) === String(currentUserId);
            const time = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={msg.message_id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative ${
                    isMe
                      ? 'bg-[#588157] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <span
                    className={`text-[10px] block text-right mt-1 ${
                      isMe ? 'text-green-100' : 'text-gray-400'
                    }`}
                  >
                    {time}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <form onSubmit={handleSend} className="bg-white p-4 border-t border-gray-200 flex items-center gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#588157]/50 text-sm"
        />

        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-[#588157] text-white p-3 rounded-full hover:bg-[#3A5A40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
