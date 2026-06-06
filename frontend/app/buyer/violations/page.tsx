"use client";

import ReportViolationPage from "@/components/features/violations/ReportViolationPage";
import { Suspense } from "react";

export default function BuyerViolationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
      <ReportViolationPage role="buyer" />
    </Suspense>
  );
}
