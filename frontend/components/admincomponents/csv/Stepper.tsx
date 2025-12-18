type StepperProps = {
    currentStep: number;
};

const steps = [
    "Upload CSV",
    "Column Mapping",
    "Preview Data",
    "Confirmation",
];

export function Stepper({ currentStep }: StepperProps) {
    return (
        <div className="flex justify-between mb-8">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const active = currentStep >= stepNumber;

                return (
                    <div key={step} className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${active ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"}`}
                        >
                            {stepNumber}
                        </div>
                        <span
                            className={`text-sm ${active ? "text-green-700 font-medium" : "text-gray-400"
                                }`}
                        >
                            {step}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
