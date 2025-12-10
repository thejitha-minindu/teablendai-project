"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquarePlus,
    History,
    Settings,
    Trash2,
    ChevronLeft,
    ChevronRight,
    User,
    HelpCircle,
    LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHistoryItem {
    id: string;
    title: string;
    timestamp: Date;
    preview: string;
}

interface ChatSidebarProps {
    onNewChat?: () => void;
    onSelectChat?: (chatId: string) => void;
    onDeleteChat?: (chatId: string) => void;
    className?: string;
}

export function ChatSidebar({
    onNewChat,
    onSelectChat,
    onDeleteChat,
    className,
}: ChatSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Mock chat history
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(() => [
        {
            id: "1",
            title: "Sri Lanka Tea Production Overview",
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            preview: "Annual tea production statistics and regional breakdown",
        },
        {
            id: "2",
            title: "Export Market Analysis",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            preview: "Key export destinations and market trends",
        },
        {
            id: "3",
            title: "Tea Quality Grades",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
            preview: "Grading system and quality assessment methods",
        },
        {
            id: "4",
            title: "Plantation Economics",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            preview: "Cost analysis and profit margins for tea estates",
        },
        {
            id: "5",
            title: "Sustainable Practices",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            preview: "Environmental impact and organic tea initiatives",
        },
    ]);

    const handleNewChat = () => {
        setSelectedChatId(null);
        onNewChat?.();
    };

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        onSelectChat?.(chatId);
    };

    const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
        if (selectedChatId === chatId) setSelectedChatId(null);
        onDeleteChat?.(chatId);
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            className={cn(
                "h-screen bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col relative",
                "transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-80",
                className
            )}
            initial={{ x: -320 }}
            animate={{ x: 0 }}
        >
            {/* HEADER */}
            <div className="p-4 border-b border-white/5">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <img className="w-60 h-24" src="/TeaLogo.png" alt="Tea Logo" />
                                <button
                                    onClick={() => setIsCollapsed(true)}
                                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8 text-white/60" />
                                </button>
                            </div>

                            <motion.button
                                onClick={handleNewChat}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/90 transition-all border border-white/5"
                            >
                                <MessageSquarePlus className="w-8 h-8" />
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
                            <button
                                onClick={() => setIsCollapsed(false)}
                                className="p-2 rounded-lg transition-colors"
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                            >
                                <ChevronRight className="w-8 h-8 text-white/60 hover:text-white" />
                            </button>

                            <button
                                onClick={handleNewChat}
                                className="p-2 rounded-lg transition-colors"
                                title="New chat"
                                aria-label="New chat"
                            >
                                <MessageSquarePlus className="w-7 h-7 text-white/70 hover:text-white" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* CHAT LIST */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <AnimatePresence>
                    {!isCollapsed ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-4 h-full"
                        >
                            <h2 className="text-lg font-semibold text-white/90 mb-4">
                                Chat History
                            </h2>

                            {chatHistory.length > 0 ? (
                                <div className="space-y-1">
                                    {chatHistory.map((chat) => (
                                        <ChatHistoryCard
                                            key={chat.id}
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
                                <div className="text-center py-12">
                                    <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/40 text-sm">No chat history yet</p>
                                </div>
                            )}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-white/5 relative">
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
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-white/70 hover:text-white/90" 
                                title="Settings"
                            >
                                <Settings className="w-8 h-8" />
                                <span className="text-sm">Settings</span>
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
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="p-2 rounded-lg transition-colors"
                                title="Settings"
                                aria-label="Settings"
                            >
                                <Settings className="w-8 h-8 text-white/60 hover:text-white/90" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                    {showProfileMenu && !isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full left-4 right-4 mb-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="p-3 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#558332] flex items-center justify-center">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">User</p>
                                        <p className="text-xs text-white/50">user@example.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    <span>Help & Support</span>
                                </button>
                            </div>

                            <div className="p-2 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {showProfileMenu && isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-0 left-full ml-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="p-3 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#558332] flex items-center justify-center">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">User</p>
                                        <p className="text-xs text-white/50">user@example.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    <span>Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    <span>Help & Support</span>
                                </button>
                            </div>

                            <div className="p-2 border-t border-white/10">
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
    onSelect,
    onDelete,
    onHover,
    onLeave,
}: ChatHistoryCardProps) {
    const [showActions, setShowActions] = useState(false);

    return (
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
                    ? "bg-white/10 border-white/10"
                    : "hover:bg-white/5 hover:border-white/5"
            )}
        >
            <div className="flex items-start justify-between p-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white/90 truncate mb-1">
                        {chat.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate mb-1">
                        {chat.preview}
                    </p>
                </div>

                <AnimatePresence>
                    {(showActions || isSelected) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1"
                        >
                            <button
                                onClick={onDelete}
                                className="p-1.5 rounded-lg transition-colors"
                                title="Delete chat"
                            >
                                <Trash2 className="w-5 h-5 text-white/50 hover:text-white/90 cursor-pointer" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
