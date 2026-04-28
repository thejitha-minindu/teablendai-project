// --- Seller Login Page ---
// This is a simple wrapper file.
// Instead of writing the login logic twice (once for buyers, once for sellers),
// we import a shared component called "RoleLoginForm".
import { Suspense } from "react";
import { RoleLoginForm } from "@/components/auth/RoleLoginForm";

export default function SellerLoginPage() {
  // We pass 'role="seller"' so the form knows to log the user in as a seller
  // and redirect them to the seller dashboard afterward.
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoleLoginForm role="seller" />
    </Suspense>
  );
}
