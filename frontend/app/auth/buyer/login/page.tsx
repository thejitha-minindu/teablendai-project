// --- Buyer Login Page ---
// This is a simple wrapper file. 
// Instead of writing the login logic twice (once for buyers, once for sellers),
// we import a shared component called "RoleLoginForm".
import { RoleLoginForm } from "@/components/auth/RoleLoginForm";

export default function BuyerLoginPage() {
  // We pass 'role="buyer"' so the form knows to log the user in as a buyer
  // and redirect them to the buyer dashboard afterward.
  return <RoleLoginForm role="buyer" />;
}
