"use client";

import { fi } from "date-fns/locale";
import { MoreVertical, User, FileText, Link } from "lucide-react";
import { useState } from "react";


type UserCardProps = {
    name: string;
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
};

export function UserCard({ name, id , email, first_name, last_name}: UserCardProps) {

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("pending");

    const verifyUser = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `http://localhost:8000/admin/users/approve/${id}`,
                {
                    method: "PUT",
                }
            );

            if (!res.ok) {
                throw new Error("Verification failed");
            }

            setStatus("approved");

        } catch (error) {
            console.error(error);
            alert("Failed to verify user");
        } finally {
            setLoading(false);
        }
    };

    const rejectUser = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `http://localhost:8000/admin/users/reject/${id}`,
                {
                    method: "PUT",
                }
            );

            if (!res.ok) {
                throw new Error("Reject failed");
            }

            setStatus("rejected");

        } catch (error) {
            console.error(error);
            alert("Failed to reject user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-5 mb-5 w-full max-w-full min-w-0 block min-h-48">

            {/* LEFT SIDE */}
            <div className="flex gap-4">

                {/* USER ICON */}
                <div className="w-8 h-8 rounded-full border flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                </div>

                {/* USER DETAILS */}
                <div>
                    <h3 className="font-semibold text-lg">{name}</h3>

                    <p className="text-sm text-gray-500">
                        ID: {id}
                    </p>

                    <p className="text-sm text-gray-500">
                        First Name : {first_name}
                    </p>

                    <p className="text-sm text-gray-500">
                        Last Name : {last_name}
                    </p>

                    <p className="text-sm text-gray-500">
                        Email : {email}
                    </p>

                    <p className="text-sm text-gray-500">
                        Refer the documentation and click verify or reject.
                    </p>

                    {/* ICON BUTTONS */}
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

            {/* STATUS */}
            {status !== "pending" && (
                <div className={`mt-4 text-sm font-semibold ${status === "approved" ? "text-green-600" : "text-red-600"}`}>
                    Status: {status.toUpperCase()}
                </div>
            )}

            {/* ACTION BUTTONS */}
            {status === "pending" && (
                <div className="flex gap-3 mt-4 justify-end">

                    <button
                        onClick={rejectUser}
                        disabled={loading}
                        className="px-4 py-1 border rounded-md text-sm hover:bg-red-100 disabled:opacity-50"
                    >
                        Reject
                    </button>

                    <button
                        onClick={verifyUser}
                        disabled={loading}
                        className="px-4 py-1 border rounded-md text-sm hover:bg-green-100 disabled:opacity-50"
                    >
                        Verify
                    </button>

                </div>
            )}
        </div>
    );
}