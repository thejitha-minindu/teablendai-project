import { UserCard } from "@/components/admincomponents/UserCard";

export default function VerificationPage() {
    const users = [
        { name: "John Doe", id: "TEA001BY", role: "Buyer" },
        { name: "Jane Smith", id: "TEA002SL", role: "Seller" },
        { name: "Robert Chen", id: "TEA003BY", role: "Buyer" },
        { name: "Miyamoto Sato", id: "TEA004SL", role: "Seller" },
        { name: "Priya Sharma", id: "TEA005BY", role: "Buyer" },
        { name: "David Wilson", id: "TEA006SL", role: "Seller" },
        { name: "Wei Zhang", id: "TEA007BY", role: "Buyer" },
        { name: "Ananya Patel", id: "TEA008SL", role: "Seller" },
        { name: "James O'Connor", id: "TEA009BY", role: "Buyer" },
        { name: "Fatima Al-Mansoor", id: "TEA010SL", role: "Seller" }
    ];

    return (
        <div>
            {/* <h2 className="text-xl font-bold mb-4">User Verification</h2> */}
            {users.map((user, index) => (
                <div key={index} className="max-w-3xl mb-4">
                    <UserCard 
                        name={`${user.name} (${user.role})`} 
                        id={user.id} 
                    />
                </div>
            ))}
        </div>
    );
}