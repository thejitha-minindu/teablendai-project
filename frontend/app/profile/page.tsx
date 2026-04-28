import { redirect } from "next/navigation";

export default function LegacyProfileRedirectPage() {
  redirect("/auth/profile");
}
