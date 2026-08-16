import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type AuthFormLayoutProps = {
  children: React.ReactNode;
};

export function AuthFormLayout({ children }: AuthFormLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-green-50 flex flex-col lg:flex-row">
      <div className="lg:w-1/2 w-full relative min-h-[50vh] lg:min-h-screen">
        <div className="absolute inset-0">
          <Image
            src="/login-image.webp"
            alt="Tea Blending Process Background"
            fill
            className="object-cover object-center"
            priority
            sizes="50vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        </div>

        <div className="absolute top-6 left-6 z-20">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft className="w-4 h-4 text-white/80 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
            <div className="relative h-12 w-32">
              <Image
                src="/tea-blend-logo.svg"
                alt="Tea Blend AI Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full blur-3xl" />
        </div>
      </div>

      <div className="lg:w-1/2 w-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative h-14 w-40">
              <Image
                src="/tea-blend-logo.svg"
                alt="Tea Blend AI Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
