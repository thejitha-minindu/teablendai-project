export function Step4Confirm() {
    return (
        <div className="bg-white rounded-xl border p-6 space-y-6 text-center">
            <h2 className="text-xl font-bold">Confirm Data Insertion</h2>

            <p className="text-gray-600">
                Only valid records will be inserted into the database.
            </p>

            <button className="bg-green-700 text-white px-8 py-3 rounded-lg text-lg">
                Insert Valid Data
            </button>
        </div>
    );
}
