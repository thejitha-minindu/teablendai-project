"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 bg-green-900 text-white shadow-md">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Tea Blend AI"
          width={100}
          height={100}
          className="rounded-sm"
        />
        {/* <div className="text-lg font-bold">
          TEA BLEND <span className="text-green-400">AI</span>
        </div> */}
      </div>

      {/* Profile */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 focus:outline-none"
        >
          <span className="text-sm">Admin xxxxx</span>
          <Image
            src="/admin-avatar.svg"
            alt="Admin"
            width={36}
            height={36}
            className="rounded-full border"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-3 w-56 bg-green-800 rounded-xl shadow-lg overflow-hidden z-50">
            <DropdownItem label="View Profile" />
            <DropdownItem label="Analytics & Data" />
            <DropdownItem label="Help Center" />
            <DropdownItem label="Account Settings" />
            <div className="border-t border-green-700" />
            <button className="w-full text-left px-4 py-3 text-red-300 hover:bg-green-700">
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function DropdownItem({ label }: { label: string }) {
  return (
    <button className="w-full text-left px-4 py-3 text-sm hover:bg-green-700">
      {label}
    </button>
  );
}
