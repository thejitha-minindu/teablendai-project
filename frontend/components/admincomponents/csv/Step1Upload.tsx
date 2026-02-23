"use client";

export default function Step1Upload({
    setFile,
    table,
    setTable,
    setCsvHeaders,
    setPreviewData,
}: any) {

    // Lightweight CSV parser to avoid external dependency issues.
    function parseCSVText(text: string, preview = 5) {
        // split into lines and handle CRLF
        const lines = text.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
        if (lines.length === 0) return { headers: [], rows: [] };

        // basic CSV line parser (handles quoted fields)
        const parseLine = (line: string) => {
            const result: string[] = [];
            let cur = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        cur += '"';
                        i++; // skip escaped quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (ch === "," && !inQuotes) {
                    result.push(cur);
                    cur = "";
                } else {
                    cur += ch;
                }
            }
            result.push(cur);
            return result.map((s) => s.trim());
        };

        const headers = parseLine(lines[0]);
        const rows = lines.slice(1, 1 + preview).map(parseLine).map((cells) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
                obj[h || `col_${i}`] = cells[i] ?? "";
            });
            return obj;
        });

        return { headers, rows };
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        console.log("Step1Upload: selectedFile=", selectedFile);
        setFile(selectedFile);

        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result || "");
                console.log("Read file text length:", text.length);
                const { headers, rows } = parseCSVText(text, 5);
                console.log("Parsed headers:", headers, "rows:", rows);
                setCsvHeaders(headers || []);
                setPreviewData(rows || []);
            } catch (err) {
                console.error("CSV parse error:", err);
                setCsvHeaders([]);
                setPreviewData([]);
            }
        };
        reader.onerror = (err) => {
            console.error("FileReader error:", err);
            setCsvHeaders([]);
            setPreviewData([]);
        };
        reader.readAsText(selectedFile);
    };

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
                onChange={handleFileChange}
                className="border p-2 rounded w-full"
            />
        </div>
    );
}