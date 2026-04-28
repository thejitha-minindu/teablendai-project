import type { LucideIcon } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

type AuthCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  loginHref: string;
  registerHref: string;
};

export function AuthCard({
  title,
  description,
  icon: Icon,
  loginHref,
  registerHref,
}: AuthCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-green-100 bg-white/90 p-8 shadow-xl shadow-green-100/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-100/70 lg:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(22,163,74,0.14),transparent_45%)]" />
      <div className="relative">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg">
          <Icon className="h-8 w-8" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-base leading-7 text-gray-600">{description}</p>

        <div className="mt-8 space-y-3">
          <AuthButton href={loginHref}>Login</AuthButton>
          <AuthButton href={registerHref} variant="secondary">
            Register
          </AuthButton>
        </div>
      </div>
    </div>
  );
}
