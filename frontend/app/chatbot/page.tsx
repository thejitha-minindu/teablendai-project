"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedAIChat } from "../../components/features/chatbot/chat";
import { ChatSidebar } from "../../components/features/chatbot/chatSidebar";
import MessageBubble from "../../components/features/chatbot/MessageBubble";
import { chatService, ChatMessage, ConversationSummary } from "../../services/chatService";
import { ArrowDownIcon } from "@/components/ui/arrow-down";


export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when new messages arrive, but only if user is near bottom
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Load conversation list for sidebar
  const loadConversations = useCallback(async () => {
    const data = await chatService.getConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add loading placeholder
    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const response = await chatService.sendMessage(message, conversationId);

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
        // Refresh sidebar to show new conversation
        loadConversations();
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer || "I couldn't find an answer.",
        timestamp: response.timestamp,
        sql_query: response.sql_query,
        data: response.data,
        visualization_type: response.visualization_type,
        visualization: response.visualization,
        source: response.source,
        row_count: response.row_count,
        search_results: response.search_results,
        error: response.error,
      };

      setMessages((prev) =>
        prev.map((m) => (m.isLoading ? assistantMsg : m))
      );
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please try again.",
        timestamp: new Date().toISOString(),
        source: "error",
        error: String(error),
      };
      setMessages((prev) =>
        prev.map((m) => (m.isLoading ? errorMsg : m))
      );
    } finally {
      setIsLoading(false);
    }
  };

  // New chat - clear everything
  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  // Load a past conversation from sidebar
  const handleSelectChat = async (chatId: string) => {
    const id = parseInt(chatId);
    if (isNaN(id)) return;

    setConversationId(id);
    setMessages([]);

    const history = await chatService.getConversationMessages(id);
    setMessages(history);
    
    // Scroll to bottom after loading history
    setTimeout(scrollToBottom, 100);
  };

  // Delete conversation
  const handleDeleteChat = async (chatId: string) => {
    const id = parseInt(chatId);
    if (!isNaN(id)) {
      await chatService.deleteConversation(id);
      if (conversationId === id) {
        setMessages([]);
        setConversationId(null);
      }
      loadConversations();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar with real conversation history */}
      <ChatSidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Messages display - only shows when there are messages */}
        {hasMessages && (
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button - only shows when not at bottom */}
        <AnimatePresence>
          {hasMessages && showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="fixed bottom-24 right-8 w-12 h-12 bg-[#558332] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
              aria-label="Scroll to bottom"
            >
              <ArrowDownIcon className="w-7 h-7" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat input - always visible, centered when no messages */}
        <div className={hasMessages ? "shrink-0" : "flex-1"}>
          <AnimatedAIChat
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            showWelcome={!hasMessages}
          />
        </div>
      </div>
    </div>
  );
}