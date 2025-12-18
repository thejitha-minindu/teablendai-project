"use client";

import { useState } from "react";
import { Stepper } from "@/components/admincomponents/csv/Stepper";
import { Step1Upload } from "@/components/admincomponents/csv/Step1Upload";
import { Step2Mapping } from "@/components/admincomponents/csv/Step2Mapping";
import { Step3Preview } from "@/components/admincomponents/csv/Step3Preview";
import { Step4Confirm } from "@/components/admincomponents/csv/Step4Confirm";

export default function InsertDataPage() {
    const [step, setStep] = useState(1);
    const [selectedTable, setSelectedTable] = useState("");

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Insert Data to Database</h1>

            <Stepper currentStep={step} />

            {step === 1 && (
                <Step1Upload
                    selectedTable={selectedTable}
                    setSelectedTable={setSelectedTable}
                    onNext={() => setStep(2)}
                />
            )}

            {step === 2 && (
                <Step2Mapping
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                />
            )}

            {step === 3 && (
                <Step3Preview
                    onBack={() => setStep(2)}
                    onNext={() => setStep(4)}
                />
            )}

            {step === 4 && <Step4Confirm />}
        </div>
    );
}
