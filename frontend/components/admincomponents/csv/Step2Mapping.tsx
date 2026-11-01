"use client";

const tableFields: Record<string, string[]> = {
    TeaPurchase: [
        "PurchaseID",
        "SourceType",
        "Standard",
        "PricePerKg",
        "QuantityKg",
        "PurchaseDate",
    ],
    TeaBlendSale: [
        "SaleID",
        "CustomerID",
        "BlendName",
        "PricePerKg",
        "QuantityKg",
        "SaleDate",
    ],
    BlendComposition: ["BlendID", "Standard", "Ratio"],
    Customer: ["CustomerID", "Name", "Region"],
    BlendPurchaseMapping: [
        "MappingID",
        "SaleID",
        "PurchaseID",
        "Standard",
        "QuantityUsedKg",
    ],
};

export default function Step2Mapping({
    table,
    csvHeaders,
    mapping,
    setMapping,
}: any) {
    return (
        <div>
            <h2 className="font-semibold mb-4">Map Columns</h2>

            {tableFields[table]?.map((field) => (
                <div key={field} className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                    <span className="w-full sm:w-48 sm:shrink-0">{field}</span>

                    <select
                        className="min-w-0 w-full border rounded p-2 sm:flex-1"
                        value={mapping[field] || ""}
                        onChange={(e) =>
                            setMapping({ ...mapping, [field]: e.target.value })
                        }
                    >
                        <option value="">Select CSV column</option>
                        {csvHeaders.map((h: string) => (
                            <option key={h} value={h}>
                                {h}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    );
}
