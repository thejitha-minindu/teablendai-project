export default function Step4Confirm({
    file,
    table,
    mapping,
}: any) {

    const handleSubmit = async () => {

        if (!file || !table) {
            alert("Please select table and upload CSV file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("table", table);
        formData.append("mapping", JSON.stringify(mapping));

        try {
            const res = await fetch("http://localhost:8000/admin/upload-csv", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            alert(data.message || "Data inserted successfully!");
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold">Confirm Import</h2>

            <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-700 text-white rounded"
            >
                Confirm & Insert
            </button>
        </div>
    );
}