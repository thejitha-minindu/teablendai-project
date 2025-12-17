"use client";

import { useRouter } from "next/navigation";

export default function CreateNotificationPage() {
    const router = useRouter();

    return (
        <div className="p-6 max-w-5xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notification Manager</h1>

                {/* ONLY History button (Create button removed as you asked) */}
                <button
                    onClick={() => router.push("/admin/sendnotification/history")}
                    className="border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                >
                    ⭐ History
                </button>
            </div>

            {/* Create Notification Panel */}
            <div className="border rounded-lg overflow-hidden">
                {/* Panel Title */}
                <div className="bg-gray-200 px-4 py-2 font-semibold flex items-center gap-2">
                    ✏️ Add Notification
                </div>

                {/* Form */}
                <div className="p-6 space-y-4 bg-white">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="font-medium">Notification Title</label>
                        <input
                            className="col-span-3 border p-2 rounded"
                            placeholder="Enter title"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <label className="font-medium mt-2">Notification Content</label>
                        <textarea
                            className="col-span-3 border p-2 rounded h-32"
                            placeholder="Enter content"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="font-medium">Notification Type</label>
                        <input className="col-span-3 border p-2 rounded" />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="font-medium">Revisers</label>
                        <input className="col-span-3 border p-2 rounded" />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="font-medium">Revisers Specify</label>
                        <input className="col-span-3 border p-2 rounded" />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button className="border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100">
                            ❌ Cancel
                        </button>
                        <button className="border px-4 py-2 rounded-lg flex items-center gap-2 bg-green-700 text-white hover:bg-green-800">
                            📤 Send & Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
