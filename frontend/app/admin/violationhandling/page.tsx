"use client";

import { useEffect, useState } from "react";
import { ViolationCard } from "@/components/admincomponents/violationcard";
import { apiClient } from "@/lib/apiClient";

export default function ViolationHandlingPage() {

    const [violations, setViolations] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get("/admin/violations")
            .then(res => {
                setViolations(res.data);
            })
            .catch(err => {
                console.error("Error fetching violations:", err);
            });
    }, []);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Violation Handling</h1>

            {violations.map((violation) => (
                <ViolationCard
                    key={violation.violation_id}
                    senderId={violation.senderId}
                    violatorId={violation.violatorId}
                    violationType={violation.violationType}
                    reason={violation.reason}
                    status={violation.status}
                />
            ))}
        </div>
    );
}