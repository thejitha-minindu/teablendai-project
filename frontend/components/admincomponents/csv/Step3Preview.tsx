"use client";

export default function Step3Preview({ data }: any) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500">
                No preview data available
            </div>
        );
    }

    const headers = Object.keys(data[0]);

    return (
        <div className="overflow-auto">
            <table className="min-w-full border border-gray-300">
                <thead>
                    <tr>
                        {headers.map((key) => (
                            <th
                                key={key}
                                className="border p-2 bg-gray-100"
                            >
                                {key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row: any, index: number) => (
                        <tr key={index}>
                            {headers.map((key) => (
                                <td key={key} className="border p-2">
                                    {row[key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}