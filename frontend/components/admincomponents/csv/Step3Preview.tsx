"use client";

export default function Step3Preview({ data }: any) {
    return (
        <div>
            <h2 className="font-semibold mb-4">Data Preview</h2>

            <table className="w-full border">
                <thead>
                    <tr>
                        {Object.keys(data[0]).map((h) => (
                            <th key={h} className="border p-2 bg-gray-100">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row: any, i: number) => (
                        <tr key={i}>
                            {Object.values(row).map((v: any, j) => (
                                <td key={j} className="border p-2">
                                    {v}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
