"use client";

type TrackAuctionCardProps = {
    auctionName: string;
    estateName: string;
    grade: string;
    quantity: number;
    basePrice: number;
    startTime: string;
    status: string;
    buyer?: string;
    soldPrice?: number;
    customAuctionId?: string;
};

import { 
    Box, 
    Building2, 
    Star, 
    Package, 
    DollarSign, 
    Calendar, 
    Tag, 
    User, 
    Trophy,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from "lucide-react";

export function TrackAuctionCard({ 
    auctionName, 
    estateName, 
    grade, 
    quantity, 
    basePrice, 
    startTime, 
    status, 
    buyer, 
    soldPrice, 
    customAuctionId 
}: TrackAuctionCardProps) {
    
    const getStatusColor = () => {
        switch (status.toLowerCase()) {
            case "active":
                return { bg: "bg-green-100", text: "text-green-700", icon: <Clock className="w-3 h-3" /> };
            case "completed":
                return { bg: "bg-blue-100", text: "text-blue-700", icon: <CheckCircle className="w-3 h-3" /> };
            case "pending":
                return { bg: "bg-yellow-100", text: "text-yellow-700", icon: <AlertCircle className="w-3 h-3" /> };
            case "cancelled":
                return { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="w-3 h-3" /> };
            default:
                return { bg: "bg-gray-100", text: "text-gray-700", icon: null };
        }
    };

    const statusStyle = getStatusColor();

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 w-full border-l-4 border-green-500">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Box className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-xl text-gray-800">
                            {auctionName}
                        </h3>
                    </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.icon}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Estate:</span> {estateName}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Grade:</span> {grade}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Quantity:</span> {quantity} units
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Base Price:</span> ${basePrice.toLocaleString()}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                            <span className="font-medium">Start Time:</span> {new Date(startTime).toLocaleString()}
                        </span>
                    </div>
                    
                    {soldPrice !== undefined && soldPrice > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-600">
                                <span className="font-medium">Sold Price:</span> ${soldPrice.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {buyer && (
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                                <span className="font-medium">Buyer:</span> {buyer}
                            </span>
                        </div>
                    )}
                    
                    {status.toLowerCase() === "completed" && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Auction completed successfully
                            </p>
                        </div>
                    )}
                    
                    {status.toLowerCase() === "active" && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                            <p className="text-xs text-yellow-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Auction in progress
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer with additional info */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-400">
                    Reference ID: {customAuctionId || "N/A"}
                </div>
                <div className="flex gap-2">
                    {status.toLowerCase() === "active" && (
                        <button className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            View Bids
                        </button>
                    )}
                    {status.toLowerCase() === "completed" && (
                        <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            View Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}