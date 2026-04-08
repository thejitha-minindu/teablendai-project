"use client";

const requiredFieldsByTable: Record<string, string[]> = {
    TeaPurchase: ["PurchaseDate"],
    TeaBlendSale: ["SaleDate"],
};

export default function Step4Confirm({
    file,
    table,
    mapping,
}: any) {
    const handleUpload = async () => {
        if (!file || !table) {
            alert("Missing file or table");
            return;
        }

        const missingRequiredMappings = (requiredFieldsByTable[table] || []).filter(
            (field) => !mapping?.[field]
        );
        if (missingRequiredMappings.length > 0) {
            alert(
                `Missing required mappings: ${missingRequiredMappings.join(", ")}`
            );
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("table", table);
        formData.append("mapping", JSON.stringify(mapping));

        try {
            const response = await fetch("http://localhost:8000/api/v1/admin/csv-upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                const firstRowError = errorBody?.detail?.errors?.find((e: any) => e?.row)?.error;
                const message =
                    errorBody?.detail?.fatal_error ||
                    errorBody?.detail?.errors?.[0]?.mapping_error ||
                    errorBody?.detail?.errors?.[0]?.db_error ||
                    firstRowError ||
                    errorBody?.detail?.error ||
                    "Upload failed";
                throw new Error(message);
            }

            const result = await response.json();
            alert("Upload success!");
            console.log(result);

        } catch (error) {
            console.error(error);
            const message =
                error instanceof Error ? error.message : "Upload error!";
            alert(`Upload error: ${message}`);
        }
    };

    return (
        <div>
            <h2 className="font-semibold mb-4">Confirm & Upload</h2>

            <button
                onClick={handleUpload}
                className="bg-green-700 text-white px-6 py-2 rounded"
            >
                Upload CSV
            </button>
        </div>
    );
}
