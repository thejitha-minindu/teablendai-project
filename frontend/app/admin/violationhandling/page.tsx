import { ViolationCard } from "@/components/admincomponents/violationcard";

export default function ViolationHandlingPage() {
    const violations = [
        {
            senderId: "ADMIN_001",
            violatorId: "BUYER_234",
            violationType: "Fake Bidding",
            reason: "User placed multiple fake bids to manipulate auction price."
        },
        {
            senderId: "ADMIN_002",
            violatorId: "SELLER_102",
            violationType: "Policy Violation",
            reason: "Seller listed prohibited items against platform rules."
        },
        {
            senderId: "ADMIN_001",
            violatorId: "BUYER_451",
            violationType: "Payment Fraud",
            reason: "Payment was reversed after winning the auction."
        },
        {
            senderId: "ADMIN_003",
            violatorId: "BUYER_789",
            violationType: "Harassment",
            reason: "Sending inappropriate messages to other users."
        },
        {
            senderId: "ADMIN_002",
            violatorId: "SELLER_356",
            violationType: "Misrepresentation",
            reason: "Listing contained false information about product condition."
        },
        {
            senderId: "ADMIN_004",
            violatorId: "BUYER_912",
            violationType: "Multiple Account Abuse",
            reason: "Using multiple accounts to circumvent bidding limits."
        },
        {
            senderId: "ADMIN_001",
            violatorId: "SELLER_478",
            violationType: "Non-Delivery",
            reason: "Failed to deliver item after receiving payment."
        },
        {
            senderId: "ADMIN_003",
            violatorId: "BUYER_633",
            violationType: "Bid Retraction Abuse",
            reason: "Excessive bid retractions disrupting auction flow."
        },
        {
            senderId: "ADMIN_002",
            violatorId: "SELLER_195",
            violationType: "Counterfeit Goods",
            reason: "Selling counterfeit branded items as genuine."
        },
        {
            senderId: "ADMIN_004",
            violatorId: "BUYER_844",
            violationType: "Shill Bidding",
            reason: "Colluding with seller to artificially inflate prices."
        }
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Page Title */}
            <h1 className="text-2xl font-bold mb-6">Violation Handling</h1>

            {/* Violation Cards */}
            {violations.map((violation, index) => (
                <ViolationCard
                    key={index}
                    senderId={violation.senderId}
                    violatorId={violation.violatorId}
                    violationType={violation.violationType}
                    reason={violation.reason}
                />
            ))}
        </div>
    );
}