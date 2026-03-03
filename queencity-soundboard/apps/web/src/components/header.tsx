import Image from "next/image";
import Link from "next/link";

const nav = [
  { href: "/events", label: "Events" },
  { href: "/merch", label: "Merch" },
  { href: "/about", label: "About" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-100 md:text-xl">
          <Image src="/qcs-mark.svg" alt="Queen City Soundboard logo" width={28} height={28} priority />
          <span>QueenCity Soundboard</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-slate-300 md:gap-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
