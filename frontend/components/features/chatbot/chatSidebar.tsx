"use client";

import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  History,
  User,
  User2,
  ChevronUp,
  LogOut,
  ShoppingBag,
  Menu,
  X,
  PanelLeft,
  ArrowLeft,
  MoreVertical,
  Pin,
  PinOff,
  Clock,
  Trash2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConversationSummary } from "@/services/chatService";
import { apiClient } from "@/lib/apiClient";
import {
  clearStoredAuthToken,
  getAuthClaims,
  getAuthClaimsFromToken,
  getDisplayNameFromEmail,
  getHomePathByRole,
  setStoredAuthToken,
  type UserRole,
} from "@/lib/auth";
import { Input } from "@/components/ui/input";

// Constants
const COLLAPSED_WIDTH = "w-16 md:w-20";
const EXPANDED_WIDTH = "w-full md:w-80";
const PINNED_SECTION_LABEL = "Pinned";
const RECENT_SECTION_LABEL = "Recent";
const SEARCH_DEBOUNCE_DELAY = 300;

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  pinnedAt?: Date | null;
  preview: string;
  isPinned?: boolean;
}

interface ChatSidebarProps {
  conversations?: ConversationSummary[];
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onPinChat?: (chatId: string, isPinned: boolean) => void;
  className?: string;
}

const getSwitchInfo = (currentRole: UserRole): { role: UserRole; path: string } => {
  switch (currentRole) {
    case "seller":
      return { role: "buyer", path: "/buyer/dashboard" };
    case "buyer":
      return { role: "seller", path: "/seller/dashboard" };
    default:
      return { role: "buyer", path: "/buyer/dashboard" };
  }
};

const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case "seller":
      return "Seller";
    case "buyer":
      return "Buyer";
    default:
      return "User";
  }
};

// Memoized utility function for time ago
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Confirmation Modal Component
const ConfirmationModal = memo(function ConfirmationModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (e: React.MouseEvent) => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-80 p-6 cursor-default"
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete chat?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          This action cannot be undone. The conversation will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// Chat History Card Component
interface ChatHistoryCardProps {
  chat: ChatHistoryItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onPin: (e: React.MouseEvent) => void;
  getTimeAgo: (date: Date) => string;
}

const ChatHistoryCard = memo(function ChatHistoryCard({
  chat,
  isSelected,
  onSelect,
  onDelete,
  onPin,
  getTimeAgo: getTimeAgoFn,
}: ChatHistoryCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowConfirm(true);
      setIsMenuOpen(false);
    },
    []
  );

  const handlePinClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPin(e);
      setIsMenuOpen(false);
    },
    [onPin]
  );

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent) => {
      onDelete(e);
      setShowConfirm(false);
    },
    [onDelete]
  );

  const handleCancelDelete = useCallback(() => {
    setShowConfirm(false);
  }, []);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        onClick={onSelect}
        className={cn(
          "group relative rounded-xl cursor-pointer transition-all duration-200",
          "border",
          isSelected
            ? "bg-gray-100 border-gray-300 shadow-sm"
            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
        )}
      >
        <div className="flex items-start justify-between p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {chat.isPinned && <Pin className="w-3 h-3 text-gray-400" />}
              <h4 className="text-sm font-medium text-gray-900 truncate">{chat.title}</h4>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{chat.preview}</p>
            <span className="text-xs text-gray-400">{getTimeAgoFn(chat.timestamp)}</span>
          </div>

          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={handleMenuClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-gray-200"
                aria-label="Chat options"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-36 bg-white shadow-lg border border-gray-100 rounded-xl"
            >
              <DropdownMenuItem
                onClick={handlePinClick}
                className="cursor-pointer hover:bg-gray-50 rounded-lg m-1"
              >
                {chat.isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Unpin</span>
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4 text-gray-500" />
                    <span>Pin</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 rounded-lg m-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <AnimatePresence>
        {showConfirm && (
          <ConfirmationModal onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
        )}
      </AnimatePresence>
    </>
  );
});

// Chat Section Component
const ChatSection = memo(function ChatSection({
  title,
  icon: Icon,
  chats,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  onPinChat,
}: {
  title: string;
  icon: React.ElementType;
  chats: ChatHistoryItem[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onPinChat: (id: string, isPinned: boolean, e: React.MouseEvent) => void;
}) {
  if (chats.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-2">
        <Icon className="w-3 h-3 text-gray-400" />
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-1">
        {chats.map((chat) => (
          <ChatHistoryCard
            key={`chat-${chat.id}`}
            chat={chat}
            isSelected={selectedChatId === chat.id}
            onSelect={() => onSelectChat(chat.id)}
            onDelete={(e) => onDeleteChat(chat.id, e)}
            onPin={(e) => onPinChat(chat.id, !chat.isPinned, e)}
            getTimeAgo={getTimeAgo}
          />
        ))}
      </div>
    </div>
  );
});

// Main Component
export function ChatSidebar({
  conversations = [],
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onPinChat,
  className,
}: ChatSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeUserRole, setActiveUserRole] = useState<UserRole>("seller");
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [userEmail, setUserEmail] = useState("Loading...");
  const [userName, setUserName] = useState("User");
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map real conversation data to chat history format
  const chatHistory = useMemo<ChatHistoryItem[]>(() => {
    return conversations
      .map((c) => ({
        id: String(c.conversation_id || ((c as unknown as Record<string, unknown>).id as string) || ""),
        title: c.title || "New Conversation",
        timestamp: new Date(c.updated_at || c.created_at || Date.now()),
        pinnedAt: (c as unknown as Record<string, unknown>).pinned_at
          ? new Date(String((c as unknown as Record<string, unknown>).pinned_at))
          : null,
        preview: ((c as unknown as Record<string, unknown>).preview as string) || "",
        isPinned: ((c as unknown as Record<string, unknown>).is_pinned as boolean) || false,
      }))
      .filter((item) => item.id !== "");
  }, [conversations]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    if (!query) return chatHistory;
    return chatHistory.filter(
      (chat) =>
        chat.title.toLowerCase().includes(query) || chat.preview.toLowerCase().includes(query)
    );
  }, [chatHistory, debouncedSearchQuery]);

  // Sort and categorize chats
  const { pinnedChats, unpinnedChats } = useMemo(() => {
    const sorted = [...filteredChats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        const aPinned = a.pinnedAt?.getTime() ?? a.timestamp.getTime();
        const bPinned = b.pinnedAt?.getTime() ?? b.timestamp.getTime();
        return bPinned - aPinned;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    return {
      pinnedChats: sorted.filter((chat) => chat.isPinned),
      unpinnedChats: sorted.filter((chat) => !chat.isPinned),
    };
  }, [filteredChats]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const claims = getAuthClaims();
    if (claims?.sub) {
      setUserEmail(claims.sub);
      setUserName(getDisplayNameFromEmail(claims.sub));
    }
    if (claims?.role) {
      setActiveUserRole(claims.role);
    }
  }, []);

  useEffect(() => {
    function handleClickOutsideMobile(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        window.innerWidth < 768 &&
        !target.closest(".chat-sidebar") &&
        !target.closest(".mobile-menu-toggle")
      ) {
        setIsMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideMobile);
    return () => document.removeEventListener("mousedown", handleClickOutsideMobile);
  }, []);

  const handleNewChat = useCallback(() => {
    setSelectedChatId(null);
    setIsMobileOpen(false);
    onNewChat?.();
  }, [onNewChat]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      setSelectedChatId(chatId);
      setIsMobileOpen(false);
      onSelectChat?.(chatId);
    },
    [onSelectChat]
  );

  const handleDeleteChat = useCallback(
    (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedChatId === chatId) setSelectedChatId(null);
      onDeleteChat?.(chatId);
    },
    [selectedChatId, onDeleteChat]
  );

  const handlePinChat = useCallback(
    (chatId: string, isPinned: boolean, e: React.MouseEvent) => {
      e.stopPropagation();
      onPinChat?.(chatId, isPinned);
    },
    [onPinChat]
  );

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const switchInfo = useMemo(() => getSwitchInfo(activeUserRole), [activeUserRole]);

  const handleLogout = useCallback(() => {
    clearStoredAuthToken();
    window.location.href = "/auth/login";
  }, []);

  const handleSwitchRole = useCallback(async () => {
    const targetRole = switchInfo.role;
    try {
      setIsSwitchingRole(true);
      const response = await apiClient.post("/auth/switch-role", { role: targetRole });

      const newToken = response?.data?.access_token;
      if (!newToken || typeof newToken !== "string") {
        throw new Error("Role switch did not return a valid access token");
      }

      const newClaims = getAuthClaimsFromToken(newToken);
      if (!newClaims || newClaims.role !== targetRole) {
        throw new Error("Role switch returned a token with unexpected role");
      }

      setStoredAuthToken(newToken);
      setActiveUserRole(targetRole);
      window.location.href = getHomePathByRole(targetRole);
    } catch (error) {
      console.error("Failed to switch role", error);
    } finally {
      setIsSwitchingRole(false);
    }
  }, [switchInfo.role]);

  const shouldShowOnMobile = isMobileOpen;
  const isDesktop = isMounted && typeof window !== "undefined" && window.innerWidth >= 768;

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMounted && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="mobile-menu-toggle fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 text-gray-700" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700" />
          )}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMounted && isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className={cn(
          "chat-sidebar h-screen bg-[#F9FAFB] border-r border-gray-200 flex flex-col relative",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          "fixed md:relative z-40",
          !shouldShowOnMobile && "hidden md:flex",
          className
        )}
        initial={{ x: -320 }}
        animate={{
          x: shouldShowOnMobile || (isMounted && isDesktop) ? 0 : -320,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* HEADER */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-b from-white to-[#F9FAFB]">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="relative w-32 h-16">
                    <Image
                      src="/TeaLogo.png"
                      alt="TeaBlend AI Logo"
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-contain object-center"
                      priority
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
                        aria-label="Collapse sidebar"
                      >
                        <PanelLeft className="w-4 h-4 text-gray-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      Collapse sidebar
                    </TooltipContent>
                  </Tooltip>
                </div>

                <motion.button
                  onClick={handleNewChat}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#E5F7CB] to-[#D4E8B8] hover:from-[#D4E8B8] hover:to-[#C4D8A8] rounded-xl text-gray-900 border border-gray-200 shadow-sm transition-all duration-200"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                  <span className="font-medium">New Chat</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleBack}
                      className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
                      aria-label="Go back"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    Back
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsCollapsed(false)}
                      className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
                      aria-label="Expand sidebar"
                    >
                      <PanelLeft className="w-5 h-5 text-gray-700 transform rotate-180" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    Expand sidebar
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewChat}
                      className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200"
                      aria-label="New chat"
                    >
                      <MessageSquarePlus className="w-5 h-5 text-gray-700" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    New chat
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="chat-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 h-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Chat History
                    </h2>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filteredChats.length} chats
                  </span>
                </div>

                {filteredChats.length > 0 ? (
                  <div className="space-y-4">
                    {pinnedChats.length > 0 && (
                      <ChatSection
                        title={PINNED_SECTION_LABEL}
                        icon={Pin}
                        chats={pinnedChats}
                        selectedChatId={selectedChatId}
                        onSelectChat={handleSelectChat}
                        onDeleteChat={handleDeleteChat}
                        onPinChat={handlePinChat}
                      />
                    )}

                    {unpinnedChats.length > 0 && (
                      <ChatSection
                        title={RECENT_SECTION_LABEL}
                        icon={Clock}
                        chats={unpinnedChats}
                        selectedChatId={selectedChatId}
                        onSelectChat={handleSelectChat}
                        onDeleteChat={handleDeleteChat}
                        onPinChat={handlePinChat}
                      />
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">
                      {debouncedSearchQuery ? "No matching chats found" : "No chat history yet"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {debouncedSearchQuery
                        ? "Try a different search term"
                        : "Start a new conversation to begin"}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full hover:bg-gray-50 rounded-xl p-2 transition-all duration-200">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#E5F7CB] to-[#D4E8B8] text-[#3A5A40]">
                    <User2 className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-gray-800">{userName}</span>
                        <span className="truncate text-xs text-gray-500 capitalize">
                          {getRoleDisplayName(activeUserRole)} Account
                        </span>
                      </div>
                      <ChevronUp className="ml-auto w-4 h-4 text-gray-500 transition-transform group-hover:rotate-180" />
                    </>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align={isCollapsed ? "start" : "end"}
              className="min-w-72 rounded-xl bg-white shadow-xl border border-gray-100 mb-2"
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-3 text-left">
                  <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-[#E5F7CB] to-[#D4E8B8] text-[#3A5A40]">
                    <User2 className="w-6 h-6" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-gray-900">{userName}</span>
                    <span className="truncate text-xs text-gray-500">{userEmail}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50 rounded-lg m-1">
                <Link href="/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer hover:bg-gray-50 rounded-lg m-1"
                disabled={isSwitchingRole}
                onClick={handleSwitchRole}
              >
                <ShoppingBag className="mr-2 h-4 w-4 text-gray-500" />
                <span>
                  {isSwitchingRole
                    ? "Switching role..."
                    : `Switch to ${getRoleDisplayName(switchInfo.role)}`}
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50 rounded-lg m-1">
                <Link href="/analytics-dashboard" className="flex items-center w-full">
                  <History className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Analytics Dashboard</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 rounded-lg m-1"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </>
  );
}