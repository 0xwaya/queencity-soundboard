import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Clean / Pro / Edgy
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">QueenCity Soundboard</h1>
        <p className="mt-4 max-w-2xl text-gray-600">
          Dynamic event hub for tickets, drops, and community experiences.
          Mobile-first web app powered by Vercel + Supabase.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/events" className="rounded-md bg-black px-4 py-2 text-white">
            Explore Events
          </Link>
          <Link href="/merch" className="rounded-md border px-4 py-2">
            Shop Merch
          </Link>
        </div>
      </section>
    </div>
  );
}
