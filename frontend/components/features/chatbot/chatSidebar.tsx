"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
import { DeleteIcon } from "@/components/ui/delete";
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

const getSwitchInfo = (
    currentRole: UserRole
): { role: UserRole; path: string } => {
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
    const [activeUserRole, setActiveUserRole] = useState<UserRole>("seller");
    const [isSwitchingRole, setIsSwitchingRole] = useState(false);
    const [userEmail, setUserEmail] = useState("Loading...");
    const [userName, setUserName] = useState("User");
    const [isMounted, setIsMounted] = useState(false);
    const role: UserRole = activeUserRole;

    // Map real conversation data to chat history format
    const chatHistory: ChatHistoryItem[] = conversations
        .map((c) => ({
            id: String(c.conversation_id || ((c as unknown as Record<string, unknown>).id as string) || ""),
            title: c.title || "New Conversation",
            timestamp: new Date(c.updated_at || c.created_at || Date.now()),
            preview: ((c as unknown as Record<string, unknown>).preview as string),
        }))
        .filter((item) => item.id !== "");

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

    const switchInfo = useMemo(() => getSwitchInfo(role), [role]);

    const handleLogout = () => {
        clearStoredAuthToken();
        window.location.href = "/auth/login";
    };

    const handleSwitchRole = async () => {
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
                <div className="p-4 border-t border-gray-200 bg-white">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full hover:bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#E5F7CB] text-[#3A5A40]">
                                        <User2 className="w-5 h-5" />
                                    </div>
                                    {!isCollapsed && (
                                        <>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold text-gray-800">
                                                    {userName}
                                                </span>
                                                <span className="truncate text-xs text-gray-500 capitalize">
                                                    {getRoleDisplayName(role)} Account
                                                </span>
                                            </div>
                                            <ChevronUp className="ml-auto w-4 h-4 text-gray-500 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            side="top"
                            align={isCollapsed ? "start" : "end"}
                            className="min-w-72 rounded-lg bg-white shadow-xl border border-gray-100 mb-2"
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-3 px-2 py-2.5 text-left">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E5F7CB] text-[#3A5A40]">
                                        <User2 className="w-6 h-6" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">{userName}</span>
                                        <span className="truncate text-xs text-gray-500">{userEmail}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
                                <Link href="/profile" className="flex items-center w-full">
                                    <User className="mr-2 h-4 w-4 text-gray-500" />
                                    <span>My Profile</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-gray-50"
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

                            <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-50">
                                <Link href="/analytics-dashboard" className="flex items-center w-full">
                                    <History className="mr-2 h-4 w-4 text-gray-500" />
                                    <span>Analytics Dashboard</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
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
                                            <DeleteIcon className="w- h-5 text-gray-500 hover:text-red-500 cursor-pointer" />
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