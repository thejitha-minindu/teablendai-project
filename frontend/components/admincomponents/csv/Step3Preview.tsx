type Props = {
    onNext: () => void;
    onBack: () => void;
};

export function Step3Preview({ onNext, onBack }: Props) {
    return (
        <div className="bg-white rounded-xl border p-6 space-y-6">
            <h2 className="text-xl font-bold">Preview Data</h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Total Records : <b>120</b></div>
                <div className="text-green-700">✅ Valid : <b>110</b></div>
                <div className="text-red-600">❌ Invalid : <b>10</b></div>
                <div className="text-yellow-600">⚠ Warnings : <b>3</b></div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Column 1</th>
                            <th className="p-2 text-left">Column 2</th>
                            <th className="p-2 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t">
                            <td className="p-2">Value A</td>
                            <td className="p-2">Value B</td>
                            <td className="p-2 text-green-600">Valid</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between">
                <button onClick={onBack} className="border px-6 py-2 rounded-lg">
                    Back
                </button>
                <button onClick={onNext} className="bg-green-700 text-white px-6 py-2 rounded-lg">
                    Next
                </button>
            </div>
        </div>
    );
}
