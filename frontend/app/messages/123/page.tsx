"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Send, Paperclip, MoreVertical, Phone, 
  ShieldCheck, User 
} from 'lucide-react';

// Mock Data Types
type Message = {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
};

export default function ChatPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Mock Conversation Data
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I see you've marked the order as shipped.", sender: 'me', time: "10:30 AM" },
    { id: 2, text: "Yes, the truck left the estate this morning. Expected arrival is tomorrow.", sender: 'other', time: "10:32 AM" },
    { id: 3, text: "Great, thanks for the update. Is the invoice attached?", sender: 'me', time: "10:33 AM" },
    { id: 4, text: "I have uploaded it to the documents section, but I can send it here too.", sender: 'other', time: "10:35 AM" },
  ]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage("");

    // Simulate Reply (Optional demo feature)
    setTimeout(() => {
      const replyMsg: Message = {
        id: Date.now() + 1,
        text: "Received! Let me know if you need anything else.",
        sender: 'other',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
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
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-1">
              Kenmare Estate <ShieldCheck className="w-3 h-3 text-blue-500" />
            </h2>
            <p className="text-xs text-green-600 font-medium">Order #{params.orderId}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <Phone className="w-5 h-5" />
          </button>
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
            Today
          </span>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative ${
                msg.sender === 'me' 
                  ? 'bg-[#588157] text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <span 
                className={`text-[10px] block text-right mt-1 ${
                  msg.sender === 'me' ? 'text-green-100' : 'text-gray-400'
                }`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT AREA --- */}
      <form onSubmit={handleSend} className="bg-white p-4 border-t border-gray-200 flex items-center gap-3">
        <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>
        
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