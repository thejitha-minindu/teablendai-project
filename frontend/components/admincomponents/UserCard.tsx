"use client";

type UserCardProps = {
    name: string;
    id: string;
};

export function UserCard({ name, id }: UserCardProps) {
    return (
        <div className="border-2 border-green-800 rounded-xl p-5 bg-white flex justify-between items-center mb-5 w-full">

            {/* LEFT SIDE */}
            <div className="flex gap-4">
                {/* Info icon */}
                <div className="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center">
                    <img
                        src="/user-avatar.svg"
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                    />
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
                        <button className="hover:text-black">🔗</button>
                        <button className="hover:text-black">⬇️</button>
                        <button className="hover:text-black">⋮</button>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex gap-3">
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
