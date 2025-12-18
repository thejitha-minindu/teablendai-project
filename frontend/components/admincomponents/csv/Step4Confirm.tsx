"use client";

export default function Step4Confirm() {
    return (
        <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Confirm Import</h2>
            <p className="text-gray-600">
                Valid data will be inserted into the database.
            </p>

            <button className="px-6 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                Confirm & Insert
            </button>
        </div>
    );
}
