import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          QueenCity Soundboard
        </Link>
        <nav className="flex gap-5 text-sm font-medium">
          <Link href="/events">Events</Link>
          <Link href="/merch">Merch</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
