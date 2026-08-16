import Link from "next/link";
import { ArrowRight } from "lucide-react";

type AuthButtonProps = {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
};

export function AuthButton({
  href,
  variant = "primary",
  children,
}: AuthButtonProps) {
  const className =
    variant === "primary"
      ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg hover:from-green-700 hover:to-emerald-600 hover:shadow-xl"
      : "border border-green-200 bg-white text-green-700 hover:bg-green-50";

  return (
    <Link
      href={href}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-300 sm:text-base ${className}`}
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
