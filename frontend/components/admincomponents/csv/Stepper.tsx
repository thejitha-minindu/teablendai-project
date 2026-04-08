"use client";

const steps = ["Upload CSV", "Map Columns", "Preview", "Confirm"];

export default function Stepper({ current }: { current: number }) {
    return (
        <div className="flex justify-between mb-8">
            {steps.map((s, i) => (
                <div key={i} className="flex-1 text-center">
                    <div
                        className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center 
            ${i <= current ? "bg-green-700 text-white" : "bg-gray-300"}`}
                    >
                        {i + 1}
                    </div>
                    <p className="mt-2 text-sm">{s}</p>
                </div>
            ))}
        </div>
    );
}
