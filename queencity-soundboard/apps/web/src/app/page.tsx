import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1630] via-[#0b1228] to-[#070b17] p-7 md:p-11">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Night Mode • Pro • Edgy</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-100 md:text-6xl">
          Live culture. Seamless tickets. Sold-out nights.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          QueenCity Soundboard connects Venezuelan artists and Midwest audiences through premium event
          experiences with a mobile-first ticket flow.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/events" className="rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400">
            Explore Events
          </Link>
          <Link
            href="/merch"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            Shop Merch
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Mobile Optimized</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Secure Checkout</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Ticket Tailor Powered</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300/80">Featured</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-100">Roots x Caracas Night</h3>
          <p className="mt-1 text-sm text-slate-400">Madison Theater • Mar 14 • 8:00 PM</p>
          <p className="mt-3 text-sm text-slate-300">Cross-cultural showcase with live sets, exclusive drops, and immersive visuals.</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e1732] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Ticket Tailor</p>
            <Link href="/events" className="mt-2 inline-flex rounded-md bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-400">Buy Tickets</Link>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/80">Upcoming</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-100">Latin Acoustic Sessions</h3>
          <p className="mt-1 text-sm text-slate-400">Madison Theater • Apr 05 • 7:30 PM</p>
          <p className="mt-3 text-sm text-slate-300">Intimate performances with a boutique fan experience and limited seating.</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e1732] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Limited Availability</p>
            <Link href="/events" className="mt-2 inline-flex rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10">
              See Details
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
