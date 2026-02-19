"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquarePlus,
    History,
    Settings,
    User,
    HelpCircle,
    LogOut,
    Menu,
    X,
    PanelLeft,
    ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ConversationSummary } from "@/services/chatService";
import { DeleteIcon } from "@/components/ui/delete";

interface ChatHistoryItem {
    id: string;
    title: string;
    timestamp: Date;
    preview: string;
}

interface ChatSidebarProps {
    conversations?: ConversationSummary[];
    onNewChat?: () => void;
    onSelectChat?: (chatId: string) => void;
    onDeleteChat?: (chatId: string) => void;
    className?: string;
}

export function ChatSidebar({
    conversations = [],
    onNewChat,
    onSelectChat,
    onDeleteChat,
    className,
}: ChatSidebarProps) {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Map real conversation data to chat history format
    const chatHistory: ChatHistoryItem[] = conversations
        .map((c) => ({
            id: String(c.conversation_id || (c as Record<string, unknown>).id || ""),
            title: c.title || "New Conversation",
            timestamp: new Date(c.updated_at || c.created_at || Date.now()),
            preview: (c as Record<string, unknown>).preview as string || `${c.message_count || 0} messages`,
        }))
        .filter((item) => item.id !== "");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleClickOutsideMobile(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (window.innerWidth < 768 && 
                !target.closest('.chat-sidebar') && 
                !target.closest('.mobile-menu-toggle')) {
                setIsMobileOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutsideMobile);
        return () => document.removeEventListener("mousedown", handleClickOutsideMobile);
    }, []);

    const handleNewChat = () => {
        setSelectedChatId(null);
        setIsMobileOpen(false);
        onNewChat?.();
    };

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        setIsMobileOpen(false);
        onSelectChat?.(chatId);
    };

    const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedChatId === chatId) setSelectedChatId(null);
        onDeleteChat?.(chatId);
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const shouldShowOnMobile = isMobileOpen;
    const isDesktop = isMounted && typeof window !== 'undefined' && window.innerWidth >= 768;

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            {isMounted && (
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="mobile-menu-toggle fixed top-4 left-4 z-50 md:hidden p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                >
                    {isMobileOpen ? (
                        <X className="w-6 h-6 text-gray-700" />
                    ) : (
                        <Menu className="w-6 h-6 text-gray-700" />
                    )}
                </button>
            )}

            {/* Overlay for mobile */}
            {isMounted && isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <motion.div
                className={cn(
                    "chat-sidebar h-screen bg-[#F9FAFB] border-r border-gray-200 flex flex-col relative",
                    "transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-16 md:w-20" : "w-full md:w-80",
                    "fixed md:relative z-40",
                    !shouldShowOnMobile && "hidden md:flex",
                    className
                )}
                initial={{ x: -320 }}
                animate={{ 
                    x: shouldShowOnMobile || (isMounted && isDesktop) ? 0 : -320 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {/* HEADER */}
                <div className="p-4 border-b border-gray-200">
                    <AnimatePresence mode="wait">
                        {!isCollapsed ? (
                            <motion.div
                                key="expanded"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between relative">
                                    <div className="relative w-35 h-20">
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
                                                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                                aria-label="Collapse sidebar"
                                            >
                                                <PanelLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={8}>
                                            Collapse sidebar
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <motion.button
                                    onClick={handleNewChat}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 border border-gray-200 shadow-sm transition-colors"
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
                                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                            aria-label="Go back"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-700 hover:text-gray-900" />
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
                                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                            aria-label="Expand sidebar"
                                        >
                                            <PanelLeft className="w-5 h-5 text-gray-700 hover:text-gray-900 transform rotate-180" />
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
                                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                            aria-label="New chat"
                                        >
                                            <MessageSquarePlus className="w-5 h-5 text-gray-700 hover:text-gray-900" />
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
                                <div className="flex items-center justify-between mb-4 cursor-default">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Chat History
                                    </h2>
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                        {chatHistory.length} chats
                                    </span>
                                </div>

                                {chatHistory.length > 0 ? (
                                    <div className="space-y-1">
                                        {chatHistory.map((chat) => (
                                            <ChatHistoryCard
                                                key={`chat-${chat.id}`} 
                                                chat={chat}
                                                isSelected={selectedChatId === chat.id}
                                                isHovered={hoveredChatId === chat.id}
                                                onSelect={() => handleSelectChat(chat.id)}
                                                onDelete={(e) => handleDeleteChat(chat.id, e)}
                                                onHover={() => setHoveredChatId(chat.id)}
                                                onLeave={() => setHoveredChatId(null)}
                                                getTimeAgo={getTimeAgo}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-12"
                                    >
                                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm mb-2">No chat history yet</p>
                                        <p className="text-gray-400 text-xs">Start a new chat to begin</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-gray-200 relative" ref={profileMenuRef}>
                    <AnimatePresence mode="wait">
                        {!isCollapsed ? (
                            <motion.div
                                key="expanded-footer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                <button 
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900 group" 
                                    title="Profile menu"
                                    aria-label="Profile menu"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">User</p>
                                        <p className="text-xs text-gray-500 truncate">user@example.com</p>
                                    </div>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="collapsed-footer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col gap-1 items-center"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[#558332] flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={8}>
                                        Profile
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                        {showProfileMenu && !isCollapsed && (
                            <motion.div
                                key="profile-menu-expanded"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#558332] flex items-center justify-center">
                                            <User className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">User</p>
                                            <p className="text-xs text-gray-500">user@example.com</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            setShowSettingsModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            setShowHelpModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Help & Support</span>
                                    </button>
                                </div>

                                <div className="p-2 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {showProfileMenu && isCollapsed && (
                            <motion.div
                                key="profile-menu-collapsed"
                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-0 left-full ml-2 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#558332] flex items-center justify-center">
                                            <User className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">User</p>
                                            <p className="text-xs text-gray-500">user@example.com</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            setShowSettingsModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            setShowHelpModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Help & Support</span>
                                    </button>
                                </div>

                                <div className="p-2 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettingsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowSettingsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto p-6 cursor-default"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Theme
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#558332] focus:border-transparent">
                                        <option>Light</option>
                                        <option>Dark</option>
                                        <option>System</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Language
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#558332] focus:border-transparent">
                                        <option>English</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                        <option>German</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notifications
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#558332] focus:ring-[#558332]" />
                                        <span className="text-sm text-gray-600">Enable notifications</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className="px-4 py-2 text-sm rounded-lg bg-[#558332] text-white hover:bg-[#446a28] transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Help & Support Modal */}
            <AnimatePresence>
                {showHelpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowHelpModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl w-[500px] max-w-[90vw] max-h-[80vh] overflow-y-auto p-6 cursor-default"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Help & Support</h2>
                                <button
                                    onClick={() => setShowHelpModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-2">Frequently Asked Questions</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">How do I start a new chat?</p>
                                            <p className="text-sm text-gray-500">Click the "New Chat" button in the sidebar to start a new conversation.</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Can I delete old conversations?</p>
                                            <p className="text-sm text-gray-500">Yes, hover over any chat in the history and click the delete icon.</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Is my data secure?</p>
                                            <p className="text-sm text-gray-500">We take data security seriously. All conversations are encrypted and stored securely.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Contact Support</h3>
                                    <p className="text-sm text-gray-500 mb-3">Need more help? Reach out to our support team.</p>
                                    <a href="mailto:support@teablend.ai" className="text-[#558332] hover:underline text-sm">
                                        support@teablend.ai
                                    </a>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowHelpModal(false)}
                                    className="px-4 py-2 text-sm rounded-lg bg-[#558332] text-white hover:bg-[#446a28] transition"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Chat card component
interface ChatHistoryCardProps {
    chat: ChatHistoryItem;
    isSelected: boolean;
    isHovered: boolean;
    onSelect: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onHover: () => void;
    onLeave: () => void;
    getTimeAgo: (date: Date) => string;
}

function ChatHistoryCard({
    chat,
    isSelected,
    isHovered,
    onSelect,
    onDelete,
    onHover,
    onLeave,
    getTimeAgo,
}: ChatHistoryCardProps) {
    const [showActions, setShowActions] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => {
                    onHover();
                    setShowActions(true);
                }}
                onMouseLeave={() => {
                    onLeave();
                    setShowActions(false);
                }}
                onClick={onSelect}
                className={cn(
                    "group relative p-1 rounded-xl cursor-pointer transition-all",
                    "border border-transparent",
                    isSelected
                        ? "bg-gray-100 border-gray-200 shadow-sm"
                        : "hover:bg-gray-50 hover:border-gray-200"
                )}
            >
                <div className="flex items-start justify-between p-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                            {chat.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mb-1">
                            {chat.preview}
                        </p>
                        <span className="text-xs text-gray-400">
                            {getTimeAgo(chat.timestamp)}
                        </span>
                    </div>

                    <AnimatePresence>
                        {(showActions || isSelected || isHovered) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowConfirm(true);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                            aria-label="Delete chat"
                                        >
                                            <DeleteIcon className="w-5 h-5 text-gray-500 hover:text-red-500 cursor-pointer" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={8}>
                                        Delete
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl w-80 p-6 cursor-default"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Delete chat?
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                This action cannot be undone.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => {
                                        onDelete(e);
                                        setShowConfirm(false);
                                    }}
                                    className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}