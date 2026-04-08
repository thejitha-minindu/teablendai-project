"use client";

import { Link, MoreVertical, User, FileText } from 'lucide-react';

type UserCardProps = {
    name: string;
    id: string;
};

export function UserCard({ name, id }: UserCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5 mb-5 w-full max-w-full min-w-0 block min-h-48">

            {/* LEFT SIDE */}
            <div className="flex gap-4">
                {/* Info icon */}
                <div className="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                </div>

                {/* Text */}
                <div>
                    <h3 className="font-semibold text-lg">{name}</h3>
                    <p className="text-sm text-gray-500">ID: {id}</p>
                    <p className="text-sm text-gray-500">
                        Refer the documentation and click verify or reject.
                    </p>

                    {/* Icons */}
                    <div className="flex gap-3 mt-2 text-gray-600">
                        <button className="hover:text-black">
                            <Link className="w-4 h-4" />
                        </button>
                        <button className="hover:text-black">
                            <FileText className="w-4 h-4" />
                        </button>
                        <button className="hover:text-black">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex gap-3 mt-4 justify-end">
                <button className="px-4 py-1 border rounded-md text-sm hover:bg-red-100">
                    Reject
                </button>
                <button className="px-4 py-1 border rounded-md text-sm hover:bg-green-100">
                    Verify
                </button>
            </div>
        </div>
    );
}