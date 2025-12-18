import { ViolationCard } from "@/components/admincomponents/violationcard";

export default function ViolationHandlingPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">

            {/* Page Title */}
            <h1 className="text-2xl font-bold mb-6">Violation Handling</h1>

            {/* Violation Cards */}
            <ViolationCard
                senderId="ADMIN_001"
                violatorId="BUYER_234"
                violationType="Fake Bidding"
                reason="User placed multiple fake bids to manipulate auction price."
            />

            <ViolationCard
                senderId="ADMIN_001"
                violatorId="SELLER_102"
                violationType="Policy Violation"
                reason="Seller listed prohibited items against platform rules."
            />

            <ViolationCard
                senderId="ADMIN_002"
                violatorId="BUYER_451"
                violationType="Payment Fraud"
                reason="Payment was reversed after winning the auction."
            />
        </div>
    );
}
