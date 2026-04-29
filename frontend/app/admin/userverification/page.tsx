"use client";

import { useEffect, useState } from "react";
import { UserCard } from "@/components/admincomponents/UserCard";

export default function VerificationPage() {

    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetch("http://localhost:8000/admin/users/pending")
            .then((res) => res.json())
            .then((data) => {
                console.log("API RESPONSE:", data);

                setUsers(data.users || data.data || []);
            })
            .catch((err) => console.error(err));
    }, []);

    return (
        <div>
            {Array.isArray(users) && users.map((user: any) => (
                <div key={user.user_id} className="max-w-3xl mb-4">
                    <UserCard
                        name={`${user.first_name} ${user.last_name} (${user.role})`}
                        id={user.user_id}
                    />
                </div>
            ))}
        </div>
    );
}