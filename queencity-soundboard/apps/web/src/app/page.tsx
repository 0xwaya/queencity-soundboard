import Link from "next/link";
import PollWidget from "@/components/poll-widget";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1630] via-[#0b1228] to-[#070b17] p-7 md:p-11">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Night Mode • Pro • Edgy</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-100 md:text-6xl">
          Live culture. Seamless tickets. Sold-out nights.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          QueenCity Soundboard connects Latin American artists and Midwest audiences through premium event
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

      <section className="rounded-3xl border border-white/10 bg-[#0b1228] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Venue Spotlight</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">Madison Theater</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Our home stage in Covington, KY — a historic venue built for immersive sound, elevated visuals, and packed rooms.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">Covington, KY</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e1732] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Venue link</p>
            <a
              className="text-base font-semibold text-amber-200 hover:text-amber-100"
              href="https://madisontheater.com/"
              target="_blank"
              rel="noreferrer"
            >
              madisontheater.com
            </a>
            <a
              className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-[#0b1020] hover:bg-amber-300"
              href="https://madisontheater.com/"
              target="_blank"
              rel="noreferrer"
            >
              Explore the venue
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-300/80">Trending</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-100">Caracas Unplugged: After Dark Sessions</h3>
          <p className="mt-1 text-sm text-slate-400">Madison Theater • May 16 • 8:00 PM</p>
          <p className="mt-3 text-sm text-slate-300">
            A candlelit acoustic showcase with stripped-down sets, warm storytelling, and a close-up fan experience.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e1732] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Ticket Tailor</p>
            <Link href="/events" className="mt-2 inline-flex rounded-md bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-400">Buy Tickets</Link>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300/80">Upcoming</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-100">Latin Acoustic Series</h3>
          <p className="mt-1 text-sm text-slate-400">Madison Theater • May–Aug 2026</p>
          <p className="mt-3 text-sm text-slate-300">
            Five months of intimate, stripped‑down sets—limited seats, candlelit vibes, and surprise guest moments.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0e1732] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Limited Availability</p>
            <Link href="/events" className="mt-2 inline-flex rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10">
              See Details
            </Link>
          </div>
        </article>
      </section>

      <PollWidget />

      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b1228] via-[#0c1634] to-[#101b3a] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Contact Us</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">Let’s build your next sold-out night.</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Book talent, secure the venue, or collaborate on branded drops. Our event team responds fast and keeps the flow seamless.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0b1024]/70 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Direct line</p>
              <a
                className="mt-1 inline-flex text-base font-semibold text-white hover:text-cyan-200"
                href="mailto:event@queencitysoundboard.com"
              >
                event@queencitysoundboard.com
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#050816] hover:bg-cyan-400"
                href="mailto:event@queencitysoundboard.com?subject=Event%20Inquiry"
              >
                Start an inquiry
              </a>
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
              >
                Browse events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
