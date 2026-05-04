"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { 
  Bell, 
  History, 
  Send, 
  X, 
  Mail, 
  Users, 
  AlertCircle,
  CheckCircle,
  Tag,
  UserCheck,
  FileText,
  MessageSquare,
  Scale,
  ShoppingBag
} from "lucide-react";

export default function CreateNotificationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "",
        revisers: "",
        reviserSpecify: ""
    });
    const [sending, setSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    // Auto-suggest state
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Debounced search effect
    useEffect(() => {
        if (!formData.reviserSpecify || formData.reviserSpecify.length < 2 || selectedUser) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await apiClient.get(`/admin/users/search?query=${encodeURIComponent(formData.reviserSpecify)}`);
                setSearchResults(res.data.users || []);
                setShowDropdown(true);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.reviserSpecify, selectedUser]);

    const notificationTypes = [
        { value: "System Notifications", label: "System Notifications", icon: <Bell className="w-4 h-4" />, color: "blue" },
        { value: "User Verification Notifications", label: "User Verification Notifications", icon: <UserCheck className="w-4 h-4" />, color: "green" },
        { value: "Auction-Related Notifications", label: "Auction-Related Notification", icon: <ShoppingBag className="w-4 h-4" />, color: "purple" },
        { value: "Bid & Transaction Notifications", label: "Bid & Transaction", icon: <Scale className="w-4 h-4" />, color: "orange" },
        { value: "Violation & Compliance Notifications", label: "Violation & Compliance", icon: <AlertCircle className="w-4 h-4" />, color: "red" },
        { value: "Custom Notifications", label: "Custom Notifications", icon: <MessageSquare className="w-4 h-4" />, color: "indigo" },
        { value: "Complaint & Review Notifications", label: "Complaint & Review Notifications", icon: <FileText className="w-4 h-4" />, color: "pink" }
    ];

    const reviserOptions = [
        { value: "buyer", label: "Buyers", icon: <Users className="w-4 h-4" /> },
        { value: "seller", label: "Sellers", icon: <Users className="w-4 h-4" /> },
        { value: "all", label: "All Users", icon: <Users className="w-4 h-4" /> }
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content || !formData.type || !formData.revisers) {
            alert("Please fill in all required fields");
            return;
        }

        setSending(true);
        
        try {
            // Map frontend type labels to backend NotificationTypeEnum
            let backendType = "system";
            if (formData.type.includes("Auction") || formData.type.includes("Bid")) {
                backendType = "order";
            } else if (formData.type.includes("Violation") || formData.type.includes("Complaint")) {
                backendType = "alert";
            } else if (formData.type.includes("Verification")) {
                backendType = "system";
            }

            const payload = {
                title: formData.title,
                message: formData.content,
                type: backendType,
                user_id: selectedUser ? selectedUser.user_id : null,
                target_role: formData.revisers === "all" ? null : formData.revisers
            };

            await apiClient.post("/notifications/", payload);
            
            setShowSuccess(true);
            
            // Reset form after success
            setTimeout(() => {
                setShowSuccess(false);
                setFormData({
                    title: "",
                    content: "",
                    type: "",
                    revisers: "",
                    reviserSpecify: ""
                });
                setSelectedUser(null);
            }, 2000);
        } catch (error: any) {
            console.error("Failed to send notification:", error);
            alert(error.response?.data?.detail || "Failed to send notification. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleCancel = () => {
        if (confirm("Are you sure you want to cancel? All unsaved data will be lost.")) {
            setFormData({
                title: "",
                content: "",
                type: "",
                revisers: "",
                reviserSpecify: ""
            });
            setSelectedUser(null);
        }
    };

    const getTypeIcon = (typeValue: string) => {
        const type = notificationTypes.find(t => t.value === typeValue);
        return type?.icon || <Bell className="w-4 h-4" />;
    };

    return (
        <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="w-7 h-7 text-green-700" />
                        Notification Manager
                    </h1>
                    <p className="text-gray-500 mt-1">Create and manage system notifications</p>
                </div>

                <button
                    onClick={() => router.push("/admin/sendnotification/history")}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                    <History className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                    <span className="text-gray-700 group-hover:text-green-700">History</span>
                </button>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 animate-slideDown">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-700 font-medium">Notification sent successfully!</p>
                    </div>
                </div>
            )}

            {/* Create Notification Panel */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg">
                {/* Panel Title */}
                <div className="bg-gradient-to-r from-green-50 to-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-green-700" />
                        <span className="font-semibold text-gray-800">Create New Notification</span>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    {/* Title */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-500" />
                            Notification Title <span className="text-red-500">*</span>
                        </label>
                        <div className="md:col-span-2">
                            <input
                                value={formData.title}
                                onChange={(e) => handleInputChange("title", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                placeholder="Enter notification title"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="font-medium text-gray-700 flex items-start gap-2 pt-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            Notification Content <span className="text-red-500">*</span>
                        </label>
                        <div className="md:col-span-2">
                            <textarea
                                value={formData.content}
                                onChange={(e) => handleInputChange("content", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 h-32 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                                placeholder="Enter notification content..."
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {formData.content.length} characters
                            </p>
                        </div>
                    </div>

                    {/* Notification Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-500" />
                            Notification Type <span className="text-red-500">*</span>
                        </label>
                        <div className="md:col-span-2">
                            <select
                                value={formData.type}
                                onChange={(e) => handleInputChange("type", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">Select Notification Type</option>
                                {notificationTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Revisers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            Target Audience <span className="text-red-500">*</span>
                        </label>
                        <div className="md:col-span-2">
                            <div className="flex gap-3">
                                {reviserOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleInputChange("revisers", option.value)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                                            formData.revisers === option.value
                                                ? "bg-green-600 border-green-600 text-white"
                                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        {option.icon}
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Specific User Email */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="font-medium text-gray-700 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-gray-500" />
                            Specific User (Optional)
                        </label>
                        <div className="md:col-span-2 relative">
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-2.5 border border-green-300 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                                            {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{selectedUser.first_name} {selectedUser.last_name}</p>
                                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setSelectedUser(null);
                                            setFormData(prev => ({...prev, reviserSpecify: ""}));
                                        }}
                                        className="p-1 hover:bg-green-200 rounded-full text-green-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        value={formData.reviserSpecify}
                                        onChange={(e) => {
                                            handleInputChange("reviserSpecify", e.target.value);
                                            setSelectedUser(null);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Search user by email address..."
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-3">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                        </div>
                                    )}
                                    
                                    {/* Auto-suggest Dropdown */}
                                    {showDropdown && searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {searchResults.map((user) => (
                                                <button
                                                    key={user.user_id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowDropdown(false);
                                                        setFormData(prev => ({...prev, reviserSpecify: user.email}));
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                                        {user.first_name[0]}{user.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {showDropdown && formData.reviserSpecify.length >= 2 && searchResults.length === 0 && !isSearching && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                                            No users found with this email.
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        Leave empty to send to all selected audience
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Preview Section */}
                    {(formData.title || formData.content) && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Preview
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        {getTypeIcon(formData.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">
                                            {formData.title || "Notification Title"}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {formData.content || "Notification content will appear here..."}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs text-gray-400">
                                                To: {reviserOptions.find(o => o.value === formData.revisers)?.label || "Not selected"}
                                            </span>
                                            {selectedUser && (
                                                <span className="text-xs text-gray-400">
                                                    • {selectedUser.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={sending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send & Save
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

// Import Eye icon
import { Eye } from "lucide-react";