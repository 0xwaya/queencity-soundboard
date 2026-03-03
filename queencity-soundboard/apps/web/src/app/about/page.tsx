export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">About Queen City</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">Built for culture-driven nights</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          QueenCity Soundboard is a fan-first event platform connecting Venezuelan and Latin music talent with Midwest
          audiences through premium live experiences, frictionless ticketing, and curated merch drops.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <h2 className="text-lg font-bold text-slate-100">Live Events</h2>
          <p className="mt-2 text-sm text-slate-300">Discover upcoming showcases, pop-ups, and collaborations.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <h2 className="text-lg font-bold text-slate-100">Fast Checkout</h2>
          <p className="mt-2 text-sm text-slate-300">Mobile-first ticket flow using proven third-party ticketing providers.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <h2 className="text-lg font-bold text-slate-100">Merch Drops</h2>
          <p className="mt-2 text-sm text-slate-300">Limited capsules built around artists, venues, and event moments.</p>
        </article>
      </section>
    </div>
  );
}
