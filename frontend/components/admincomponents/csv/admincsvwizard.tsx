"use client";
import { useState } from "react";
import Stepper from "./Stepper";
import Step1Upload from "./Step1Upload";
import Step2Mapping from "./Step2Mapping";
import Step3Preview from "./Step3Preview";
import Step4Confirm from "./Step4Confirm";

export default function AdminCsvWizard() {
    const [step, setStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [table, setTable] = useState("");
    const [mapping, setMapping] = useState<Record<string, string>>({});

    const csvHeaders = ["PurchaseID", "Standard", "PricePerKg"];
    const previewData = [
        { PurchaseID: "P01", Standard: "A", PricePerKg: 1200 },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-50 rounded-xl shadow">
            <Stepper current={step} />

            <div className="mt-6">
                {step === 0 && (
                    <Step1Upload
                        setFile={setFile}
                        table={table}
                        setTable={setTable}
                    />
                )}

                {step === 1 && (
                    <Step2Mapping
                        table={table}
                        csvHeaders={csvHeaders}
                        mapping={mapping}
                        setMapping={setMapping}
                    />
                )}

                {step === 2 && <Step3Preview data={previewData} />}

                {step === 3 && <Step4Confirm />}
            </div>

            {/* ✅ NEXT / BACK BUTTONS */}
            <div className="flex justify-between mt-8">
                <button
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                    className="px-5 py-2 rounded bg-gray-200 disabled:opacity-50"
                >
                    Back
                </button>

                {step < 3 && (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="px-6 py-2 rounded bg-green-700 text-white hover:bg-green-800"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}
