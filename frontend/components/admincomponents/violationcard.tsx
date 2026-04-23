"use client";

import Link from "next/link";
import { AlertTriangle, Send } from "lucide-react";

type ViolationCardProps = {
    senderId: string;
    violatorId: string;
    violationType: string;
    reason: string;
    status:string;
};

export function ViolationCard({
    senderId,
    violatorId,
    violationType,
    reason,
    status,
}: ViolationCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5  mb-5 w-full max-w-full min-w-0 block min-h-48">

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-800">
                    Violation Report
                </h3>
            </div>

            {/* Content */}
            <div className="space-y-2 text-sm text-gray-700">
                <p>
                    <span className="font-medium">Sender ID :</span> {senderId}
                </p>
                <p>
                    <span className="font-medium">Violator ID :</span> {violatorId}
                </p>
                <p>
                    <span className="font-medium">Violation Type :</span> {violationType}
                </p>
                <p>
                    <span className="font-medium">Reason :</span> {reason}
                </p>
                <p>
                    <span className="font-medium">Status:</span>{status}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-end">
                <Link href="/admin/sendnotification">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-green-800 text-green-800 hover:bg-green-50 transition">
                        <Send className="w-4 h-4" />
                        Send Notification
                    </button>
                </Link>
            </div>
        </div>
    );
}
