"use client";

import Link from "next/link";

export default function HomePage() {
    return (
        <>

            <main className="overflow-hidden">
                {/* ================= HERO SECTION ================= */}
                <section className="flex min-h-screen flex-col items-center text-center text-black bg-[url('/tea-blend-background-image.svg')] bg-cover bg-center px-4">

                    {/* NAVBAR */}
                    <div className="w-full py-4 px-6">
                        <img
                            src="/tea-blend-logo.svg"
                            alt="Tea Blend Logo"
                            className="h-20"
                        />
                    </div>

                    {/* HERO CONTENT */}
                    <div className="flex flex-col items-center mt-5 max-w-4xl">
                        <h2 className="font-serif text-lg md:text-2xl leading-relaxed">
                            “Empowering the Sri Lankan Tea Industry with Intelligent
                            Pricing and Blending Analytics”
                        </h2>

                        <div className="flex items-center gap-4 mt-8">
                            {/* Login */}
                            <Link href="/auth/login" passHref>
                                <button
                                    className="
      flex items-center gap-2
      bg-white hover:bg-white/50
      font-semibold rounded-lg px-8 h-11
      border border-transparent hover:border-black
      transition-all duration-200
    "
                                >
                                    Login
                                </button>

                            </Link>



                            {/* Sign Up */}
                            <Link href="/auth/signup" passHref>
                                <button
                                    className="
      flex items-center gap-2
      bg-transparent hover:bg-white
      font-semibold rounded-lg px-8 h-11
      border border-black hover:border-transparent
      transition-all duration-200
    "
                                >
                                    Sign Up
                                </button>
                            </Link>
                        </div>




                    </div>
                </section>

                {/* ================= SECOND SECTION ================= */}
                <section className="relative min-h-screen flex flex-col items-center justify-between text-center text-black px-4">


                    {/* BACKGROUND */}
                    <div
                        className="absolute inset-0 bg-[url('/2nd-page-background2.avif')] bg-cover bg-center -z-10"
                    />

                    {/* NAVBAR */}
                    <nav className="py-6">
                        <Link href="/">
                            <img
                                src="/2nd-page-image-two.svg"
                                alt="Logo"
                                className="h-20 mx-auto"
                            />
                        </Link>
                    </nav>

                    {/* CONTENT */}
                    <div className="flex-1 flex items-center max-w-4xl">
                        <h2 className="font-serif text-xl md:text-2xl font-semibold leading-relaxed">
                            “TeaBlendAI uses agentic artificial intelligence to analyze
                            purchase and sales data, helping producers and exporters
                            make smarter, data-driven decisions.”
                        </h2>
                    </div>

                    {/* IMAGE */}
                    <div className="pb-6">
                        <img
                            src="/tea cup.png"
                            alt="Tea Cup"
                            className="h-64 md:h-80 mx-auto"
                        />
                    </div>
                </section>

                {/* ================= FOOTER ================= */}
                <footer className="bg-black text-white px-6 md:px-16 lg:px-24 py-7">


                    <div className="flex flex-wrap justify-between gap-12">

                        <div className="max-w-xs">
                            <img src="/footer icon.png" alt="logo" className="h-16 mb-4" />
                            <p className="text-sm">
                                Designed for tea lovers who value quality, innovation,
                                and sustainability.
                                <br /><br />
                                Join our tea community
                            </p>

                            <div className='flex items-center gap-3 mt-4'>
                                {/* Instagram */}
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zM4.5 7.75A3.25 3.25 0 017.75 4.5h8.5a3.25 3.25 0 013.25 3.25v8.5a3.25 3.25 0 01-3.25 3.25h-8.5a3.25 3.25 0 01-3.25-3.25v-8.5zm9.5 1a4 4 0 11-4 4 4 4 0 014-4zm0 1.5a2.5 2.5 0 102.5 2.5 2.5 2.5 0 00-2.5-2.5zm3.5-.75a.75.75 0 11.75-.75.75.75 0 01-.75.75z" />
                                </svg>
                                {/* Facebook */}
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13.5 9H15V6.5h-1.5c-1.933 0-3.5 1.567-3.5 3.5v1.5H8v3h2.5V21h3v-7.5H16l.5-3h-3z" />
                                </svg>
                                {/* Twitter */}
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 5.92a8.2 8.2 0 01-2.36.65A4.1 4.1 0 0021.4 4a8.27 8.27 0 01-2.6 1A4.14 4.14 0 0016 4a4.15 4.15 0 00-4.15 4.15c0 .32.04.64.1.94a11.75 11.75 0 01-8.52-4.32 4.14 4.14 0 001.29 5.54A4.1 4.1 0 013 10v.05a4.15 4.15 0 003.33 4.07 4.12 4.12 0 01-1.87.07 4.16 4.16 0 003.88 2.89A8.33 8.33 0 012 19.56a11.72 11.72 0 006.29 1.84c7.55 0 11.68-6.25 11.68-11.67 0-.18 0-.35-.01-.53A8.18 8.18 0 0022 5.92z" />
                                </svg>
                                {/* LinkedIn */}
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.98 3.5C3.88 3.5 3 4.38 3 5.48c0 1.1.88 1.98 1.98 1.98h.02c1.1 0 1.98-.88 1.98-1.98C6.98 4.38 6.1 3.5 4.98 3.5zM3 8.75h3.96V21H3V8.75zm6.25 0h3.8v1.68h.05c.53-.98 1.82-2.02 3.75-2.02 4.01 0 4.75 2.64 4.75 6.07V21H17v-5.63c0-1.34-.03-3.07-1.88-3.07-1.88 0-2.17 1.47-2.17 2.98V21H9.25V8.75z" />
                                </svg>
                            </div>

                        </div>

                        <div>
                            <p className="text-lg">COMPANY</p>
                            <ul className="mt-3 text-sm space-y-2">
                                <li>Home</li>
                                <li>About</li>
                                <li>Auction</li>
                                <li>Contact</li>
                            </ul>
                        </div>

                        <div>
                            <p className="text-lg">SERVICE CENTER</p>
                            <ul className="mt-3 text-sm space-y-2">
                                <li>AI Tea Blend Creator</li>
                                <li>Tea Taste Profiler</li>
                                <li>Custom Blend Analyzer</li>
                                <li>Regional Tea Explorer</li>
                                <li>Wholesale & Retail Solutions</li>
                                <li>Tea Expert Chatbot</li>
                            </ul>
                        </div>

                        <div className="max-w-xs">
                            <p className="text-lg">CONTACT</p>
                            <p className="mt-3 text-sm">
                                No 246/2,<br />
                                Galle Road,<br />
                                Colombo 07.<br /><br />
                                Email: teablendai@gmail.com<br />
                                Phone: 011-1167432
                            </p>
                        </div>

                    </div>

                    <hr className="border-white/20 mt-8" />

                    <div className="flex flex-col md:flex-row items-center justify-between py-5 gap-2">
                        <p>© {new Date().getFullYear()} TEABLENDAI. All rights reserved.</p>
                        <div className="flex gap-4 text-sm">
                            <span>Privacy</span>
                            <span>Terms</span>
                            <span>Sitemap</span>
                        </div>
                    </div>

                </footer>
            </main>
        </>
    );
}
