type Props = {
    onNext: () => void;
    onBack: () => void;
};

export function Step2Mapping({ onNext, onBack }: Props) {
    return (
        <div className="bg-white rounded-xl border p-6 space-y-6">
            <h2 className="text-xl font-bold">Column Mapping</h2>

            <p className="text-sm text-gray-500">
                Match CSV columns with database fields.
            </p>

            {/* Dummy Mapping UI */}
            <div className="space-y-3">
                {["Column A", "Column B", "Column C"].map((col) => (
                    <div key={col} className="flex gap-4 items-center">
                        <span className="w-40 text-sm">{col}</span>
                        <select className="flex-1 border rounded-lg p-2">
                            <option>-- Select DB Column --</option>
                            <option>id</option>
                            <option>name</option>
                            <option>quantity</option>
                        </select>
                    </div>
                ))}
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
