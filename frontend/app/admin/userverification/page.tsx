import { UserCard } from "@/components/admincomponents/UserCard";

export default function VerificationPage() {
    return (
        <div>
            {/* <h2 className="text-xl font-bold mb-4">User Verification</h2> */}
            <div className="max-w-3xl">
                <UserCard name="John Doe" id="fx000001" />
                
            </div>

            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>

            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>
            
            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>
            
            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>
            
            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>
            
            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>
            
            <div className="max-w-3xl">
                <UserCard name="Jane Smith" id="fx000002" />
            </div>
            
        </div>
    );
}