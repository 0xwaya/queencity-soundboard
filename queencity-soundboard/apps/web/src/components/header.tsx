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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-100 md:text-xl">
          <Image src="/qcs-logo.png" alt="Queen City Soundboard logo" width={34} height={34} priority />
          <span className="inline sm:hidden">QCS</span>
          <span className="hidden sm:inline">QueenCity Soundboard</span>
        </Link>

        <nav
          className="flex w-full flex-wrap items-center justify-start gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300 md:w-auto md:justify-end md:text-sm md:normal-case md:tracking-normal"
          aria-label="Primary"
        >
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
      </div>
    </header>
  );
}
