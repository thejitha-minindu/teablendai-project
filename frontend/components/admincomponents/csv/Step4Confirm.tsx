"use client";
import { apiClient } from "@/lib/apiClient";

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
            const response = await apiClient.post("/admin/csv-upload", formData);

            const result = response.data;
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
