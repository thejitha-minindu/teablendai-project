"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedAIChat } from "./chat";
import { ChatSidebar } from "./chatSidebar";
import MessageBubble from "./MessageBubble";
import { chatService } from "@/services/chatbot/chatService";
import type {
  ChatMessage,
  ConversationSummary,
} from "@/types/chatbot/chat.types";
import { ArrowDownIcon } from "@/components/ui/arrow-down";

// Constants
const SCROLL_THRESHOLD = 100;

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
  const [conversationId, setConversationId] = useState<string | null>(routeConversationId);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isManualNewChat, setIsManualNewChat] = useState(false);
  const [isConversationLoading, setIsConversationLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeHistoryLoadRef = useRef(0);

  // Memoized scroll check
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
  }, []);

  const handleScroll = useCallback(() => {
    setShowScrollButton(!isNearBottom());
  }, [isNearBottom]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when messages change if near bottom
  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom();
    }
  }, [messages, isNearBottom, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  const loadConversationHistory = useCallback(
    async (targetConversationId: string, navigate = false) => {
      if (!targetConversationId) return;

      const requestId = Date.now();
      activeHistoryLoadRef.current = requestId;
      setIsConversationLoading(true);
      setIsManualNewChat(false);
      setConversationId(targetConversationId);

      try {
        const history = await chatService.getConversationMessages(targetConversationId);

        // Ignore stale async responses from older selection requests.
        if (activeHistoryLoadRef.current !== requestId) {
          return;
        }

        setMessages(history);
        setTimeout(scrollToBottom, 100);

        if (navigate) {
          router.replace(`/chatbot/conversation/${targetConversationId}`, { scroll: false });
        }
      } catch (error) {
        if (activeHistoryLoadRef.current === requestId) {
          console.error("Failed to load conversation:", error);
        }
      } finally {
        if (activeHistoryLoadRef.current === requestId) {
          setIsConversationLoading(false);
        }
      }
    },
    [router, scrollToBottom]
  );

  // Auth check
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("teablend_token") || localStorage.getItem("access_token")
        : null;

    if (!token) {
      const redirectPath = encodeURIComponent(pathname || "/chatbot/conversation");
      router.push(`/auth?redirect=${redirectPath}`);
    }
  }, [pathname, router]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load conversation from route
  useEffect(() => {
    const loadFromRoute = async () => {
      if (!routeConversationId) {
        if (isManualNewChat) {
          setConversationId(null);
          setMessages([]);
        }
        return;
      }

      await loadConversationHistory(routeConversationId, false);
    };

    loadFromRoute();
  }, [routeConversationId, isManualNewChat, loadConversationHistory]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isLoading) return;

      setIsLoading(true);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedMessage,
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
        const response = await chatService.sendMessage(trimmedMessage, conversationId);

        if (response.conversation_id) {
          const newConversationId = response.conversation_id;
          setConversationId(newConversationId);
          setIsManualNewChat(false);
          setConversations((prev) => {
            const exists = prev.some(
              (conversation) => String(conversation.conversation_id) === String(newConversationId)
            );
            if (exists) return prev;

            return [
              {
                conversation_id: String(newConversationId),
                title: trimmedMessage.slice(0, 80),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                message_count: 1,
              },
              ...prev,
            ];
          });
          loadConversations();

          const currentPathConversationId = pathname?.split("/")[3] || null;
          // Keep URL in sync without forcing scroll resets.
          if (!currentPathConversationId && currentPathConversationId !== newConversationId) {
            router.replace(`/chatbot/conversation/${newConversationId}`, { scroll: false });
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

        // Handle auth errors
        if (
          errorText.includes("Authentication required") ||
          errorText.includes("Session expired")
        ) {
          const redirectPath = encodeURIComponent(pathname || "/chatbot/conversation");
          router.push(`/auth?redirect=${redirectPath}`);
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
    },
    [isLoading, conversationId, pathname, router, loadConversations]
  );

  const handleNewChat = useCallback(() => {
    setIsManualNewChat(true);
    setMessages([]);
    setConversationId(null);
    activeHistoryLoadRef.current = 0;
    router.replace("/chatbot/conversation", { scroll: false });
  }, [router]);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (!chatId) return;
      await loadConversationHistory(chatId, true);
    },
    [loadConversationHistory]
  );

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      if (!chatId) return;

      const previousConversations = conversations;

      // Optimistic UI update for immediate feedback.
      setConversations((prev) =>
        prev.filter((conversation) => String(conversation.conversation_id) !== String(chatId))
      );

      try {
        await chatService.deleteConversation(chatId);

        if (conversationId === chatId) {
          setMessages([]);
          setConversationId(null);
          activeHistoryLoadRef.current = 0;
          router.replace("/chatbot/conversation", { scroll: false });
        }

        await loadConversations();
      } catch (error) {
        console.error("Failed to delete chat:", error);
        // Roll back optimistic update on failure.
        setConversations(previousConversations);
      }
    },
    [conversationId, conversations, router, loadConversations]
  );

  const handlePinChat = useCallback(
    async (chatId: string, shouldPin: boolean) => {
      if (!chatId) return;

      const nowIso = new Date().toISOString();

      // Optimistic UI update
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
        await loadConversations(); // Refresh to correct state
      }
    },
    [loadConversations]
  );

  const hasMessages = messages.length > 0;
  const latestAssistantIndex = useMemo(() => {
    let latestIndex = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "assistant") {
        latestIndex = i;
      }
    }
    return latestIndex;
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={conversationId || routeConversationId}
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
            isLoading={isLoading || isConversationLoading}
            showWelcome={!hasMessages}
          />
        </div>
      </div>
    </div>
  );
}
