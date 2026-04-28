import { Suspense } from "react";
import { RoleLoginForm } from "@/components/auth/RoleLoginForm";

export default function BuyerLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoleLoginForm role="buyer" />
    </Suspense>
  );
}