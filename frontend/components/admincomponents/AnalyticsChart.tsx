"use client";

export function AnalyticsChart() {
    // Dummy data for monthly activity
    const data = [
        { month: "Jan", auctions: 120, users: 85, transactions: 95 },
        { month: "Feb", auctions: 140, users: 95, transactions: 110 },
        { month: "Mar", auctions: 160, users: 110, transactions: 130 },
        { month: "Apr", auctions: 145, users: 100, transactions: 120 },
        { month: "May", auctions: 175, users: 125, transactions: 150 },
        { month: "Jun", auctions: 190, users: 135, transactions: 165 },
    ];

    const maxValue = Math.max(...data.flatMap((d) => [d.auctions, d.users, d.transactions]));

    return (
        <div className="w-full h-full">
            {/* Legend */}
            <div className="flex gap-6 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">Auctions</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-600">Transactions</span>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex items-end justify-around h-48 gap-2">
                {data.map((item, idx) => {
                    const auctionHeight = (item.auctions / maxValue) * 100;
                    const userHeight = (item.users / maxValue) * 100;
                    const transactionHeight = (item.transactions / maxValue) * 100;

                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                            {/* Bars */}
                            <div className="flex gap-1 items-end h-40 w-full justify-around">
                                {/* Auctions Bar */}
                                <div
                                    className="bg-blue-500 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                                    style={{ height: `${auctionHeight}%` }}
                                    title={`Auctions: ${item.auctions}`}
                                />

                                {/* Users Bar */}
                                <div
                                    className="bg-green-500 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                                    style={{ height: `${userHeight}%` }}
                                    title={`Users: ${item.users}`}
                                />

                                {/* Transactions Bar */}
                                <div
                                    className="bg-purple-500 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                                    style={{ height: `${transactionHeight}%` }}
                                    title={`Transactions: ${item.transactions}`}
                                />
                            </div>

                            {/* Month Label */}
                            <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                        </div>
                    );
                })}
            </div>

            {/* Stats Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                    <p className="text-gray-500">Total Auctions</p>
                    <p className="text-lg font-bold text-blue-600">930</p>
                </div>
                <div>
                    <p className="text-gray-500">Total Users</p>
                    <p className="text-lg font-bold text-green-600">650</p>
                </div>
                <div>
                    <p className="text-gray-500">Total Transactions</p>
                    <p className="text-lg font-bold text-purple-600">770</p>
                </div>
            </div>
        </div>
    );
}
