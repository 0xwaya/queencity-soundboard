"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const nav = [
  { href: "/events", label: "Events" },
  { href: "/merch", label: "Merch" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-100 md:text-xl">
          <Image src="/qcs-logo.png" alt="Queen City Soundboard logo" width={34} height={34} priority />
          <span className="inline sm:hidden">QCS</span>
          <span className="hidden sm:inline">QueenCity Soundboard</span>
        </Link>

        <nav className="hidden items-center gap-3 text-sm font-medium text-slate-300 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-white/10 p-2 text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      <nav
        id="mobile-menu"
        className={`md:hidden ${isOpen ? "block" : "hidden"} border-t border-white/10 bg-[#0b1020]/95 px-4 pb-4 pt-2`}
        aria-label="Mobile"
      >
        <ul className="flex flex-col gap-2 text-sm font-medium text-slate-300">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-full border border-white/10 px-3 py-2 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
