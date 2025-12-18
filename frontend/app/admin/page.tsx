
import { redirect } from "next/navigation";

export default function AdminPage() {
    // Server-side redirect to the seller dashboard
    redirect("/admin/dashboard");
}
