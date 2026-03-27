"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedAIChat } from "./chat";
import { ChatSidebar } from "./chatSidebar";
import MessageBubble from "./MessageBubble";
import { chatService, ChatMessage, ConversationSummary } from "@/services/chatService";
import { ArrowDownIcon } from "@/components/ui/arrow-down";

interface ChatbotConversationPageProps {
  routeConversationId?: string | null;
}

export default function ChatbotConversationPage({
  routeConversationId = null,
}: ChatbotConversationPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    routeConversationId
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isManualNewChat, setIsManualNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    const data = await chatService.getConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("teablend_token") || localStorage.getItem("access_token")
        : null;

    if (!token) {
      const redirectPath = encodeURIComponent(pathname || "/chatbot/conversation");
      router.push(`/auth/login?redirect=${redirectPath}`);
    }
  }, [pathname, router]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const loadFromRoute = async () => {
      if (!routeConversationId) {
        if (conversationId !== null && isManualNewChat) {
          setConversationId(null);
          setMessages([]);
        }
        return;
      }

      setIsManualNewChat(false);
      setConversationId(routeConversationId);
      const history = await chatService.getConversationMessages(routeConversationId);
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    };

    loadFromRoute();
  }, [routeConversationId, scrollToBottom]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

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
        const newConversationId = response.conversation_id;
        setConversationId(newConversationId);
        setIsManualNewChat(false);
        loadConversations();

        const currentPathConversationId = pathname?.split("/")[3] || null;
        if (currentPathConversationId !== newConversationId) {
          router.push(`/chatbot/conversation/${newConversationId}`);
        }
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
        data_type: response.data_type,
        state: response.state,
        message_type: response.message_type,
        prompt_type: response.prompt_type,
        field_metadata: response.field_metadata,
        input_request: response.input_request,
        validation_payload: response.validation_payload,
        auction_payload: response.auction_payload,
        result_payload: response.result_payload,
        row_count: response.row_count,
        search_results: response.search_results,
        error: response.error,
      };

      setMessages((prev) => prev.map((m) => (m.isLoading ? assistantMsg : m)));
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      if (
        errorText.includes("Authentication required") ||
        errorText.includes("Session expired")
      ) {
        const redirectPath = encodeURIComponent(pathname || "/chatbot/conversation");
        router.push(`/auth/login?redirect=${redirectPath}`);
        return;
      }

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please try again.",
        timestamp: new Date().toISOString(),
        source: "error",
        error: errorText,
      };
      setMessages((prev) => prev.map((m) => (m.isLoading ? errorMsg : m)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setIsManualNewChat(true);
    setMessages([]);
    setConversationId(null);
    router.push("/chatbot/conversation");
  };

  const handleSelectChat = (chatId: string) => {
    if (!chatId) return;
    setIsManualNewChat(false);
    router.push(`/chatbot/conversation/${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (chatId) {
      await chatService.deleteConversation(chatId);
      if (conversationId === chatId) {
        setMessages([]);
        setConversationId(null);
        router.push("/chatbot/conversation");
      }
      loadConversations();
    }
  };

  const handlePinChat = async (chatId: string, shouldPin: boolean) => {
    if (!chatId) return;

    const nowIso = new Date().toISOString();

    // Optimistic UI update so the conversation moves immediately.
    setConversations((prev) =>
      prev.map((conversation) =>
        String(conversation.conversation_id) === chatId
          ? {
              ...conversation,
              is_pinned: shouldPin,
              pinned_at: shouldPin ? nowIso : null,
            }
          : conversation
      )
    );

    try {
      if (shouldPin) {
        await chatService.pinConversation(chatId);
      } else {
        await chatService.unpinConversation(chatId);
      }
      await loadConversations();
    } catch (error) {
      console.error("Failed to update pin status", error);
      await loadConversations();
    }
  };

  const hasMessages = messages.length > 0;
  const latestAssistantIndex = messages.reduce((latest, msg, index) => {
    if (msg.role === "assistant") {
      return index;
    }
    return latest;
  }, -1);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onPinChat={handlePinChat}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {hasMessages && (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble
                    message={message}
                    onSendMessage={handleSendMessage}
                    isActionEnabled={
                      message.role === "assistant" &&
                      index === latestAssistantIndex &&
                      !message.isLoading
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}

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