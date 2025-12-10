import { redirect } from "next/navigation";

export default function SellerIndexPage() {
  // Server-side redirect to the seller dashboard
  redirect("/seller/dashboard");
}
