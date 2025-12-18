"use client";

export default function Step1Upload({
    setFile,
    table,
    setTable,
}: any) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Table</h2>

            <select
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="border p-2 rounded w-full"
            >
                <option value="">-- Select Table --</option>
                <option value="TeaPurchase">TeaPurchase</option>
                <option value="TeaBlendSale">TeaBlendSale</option>
                <option value="BlendComposition">BlendComposition</option>
                <option value="Customer">Customer</option>
                <option value="BlendPurchaseMapping">BlendPurchaseMapping</option>
            </select>

            <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="border p-2 rounded w-full"
            />
        </div>
    );
}
