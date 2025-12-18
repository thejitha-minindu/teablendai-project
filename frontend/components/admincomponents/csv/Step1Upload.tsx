type Props = {
    selectedTable: string;
    setSelectedTable: (v: string) => void;
    onNext: () => void;
};

const tables = [
    "TeaPurchase",
    "TeaBlendSale",
    "BlendComposition",
    "Customer",
    "BlendPurchaseMapping",
];

export function Step1Upload({ selectedTable, setSelectedTable, onNext }: Props) {
    return (
        <div className="bg-white rounded-xl border p-6 space-y-6">
            <h2 className="text-xl font-bold">Upload CSV File</h2>

            {/* Table Select */}
            <div>
                <label className="block text-sm font-medium mb-1">Select Table</label>
                <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full border rounded-lg p-2"
                >
                    <option value="">-- Select Table --</option>
                    {tables.map((table) => (
                        <option key={table} value={table}>
                            {table}
                        </option>
                    ))}
                </select>
            </div>

            {/* CSV Upload */}
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
                <p className="text-sm text-gray-500 mb-3">
                    Upload a .csv file with header row
                </p>
                <input type="file" accept=".csv" />
            </div>

            <div className="flex justify-end">
                <button
                    disabled={!selectedTable}
                    onClick={onNext}
                    className="bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
