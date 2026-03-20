import PollWidget from "@/components/poll-widget";
import TrackedLink from "@/components/tracked-link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1630] via-[#0b1228] to-[#070b17] p-7 md:p-11">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Intimate Acoustic Nights</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-100 md:text-6xl">
          Live culture. Seamless tickets. Sold-out nights.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          QueenCity Soundboard connects Latin American artists and Midwest audiences through premium event
          experiences with a mobile-first ticket flow.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <TrackedLink
            href="/events"
            event="cta_click"
            label="home_explore_events"
            className="qcs-button-3d rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400"
          >
            Explore Events
          </TrackedLink>
          <TrackedLink
            href="/merch"
            event="cta_click"
            label="home_shop_merch"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            Shop Merch
          </TrackedLink>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Mobile Optimized</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Secure Checkout</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Ticket Tailor Powered</span>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1228] p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/madison3.JPG')] bg-cover bg-[position:50%_70%] opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1228] via-[#0b1228]/80 to-transparent" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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

      <section className="rounded-3xl border border-white/10 bg-[#0b1228] p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">Featured lineup</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">Spotlight nights</h2>
            <p className="mt-2 text-sm text-slate-300">Choose your night and lock in seats fast.</p>
          </div>
          <TrackedLink
            href="/events"
            event="cta_click"
            label="home_view_all_events"
            className="qcs-button-3d inline-flex items-center justify-center rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400"
          >
            View all events
          </TrackedLink>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Caracas Unplugged", meta: "Franco De Vita • May 16" },
            { title: "Bolero Nights", meta: "Rudy La Escala • May 30" },
            { title: "Alma Acústica", meta: "Elena Rose • Jun 6" },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#0e1732] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Featured</p>
              <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{item.meta}</p>
              <TrackedLink
                href="/events"
                event="cta_click"
                label={`home_featured_${item.title.replace(/\s+/g, "_").toLowerCase()}`}
                className="qcs-button-3d mt-4 inline-flex rounded-md bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-400"
              >
                Buy Tickets
              </TrackedLink>
            </article>
          ))}
        </div>
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
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Direct line</p>
              <a
                className="inline-flex w-full break-all text-sm font-semibold leading-5 text-white hover:text-cyan-200 sm:text-base"
                href="mailto:event@queencitysoundboard.com"
              >
                event@queencitysoundboard.com
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="qcs-button-3d inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#050816] hover:bg-cyan-400"
                href="mailto:event@queencitysoundboard.com?subject=Event%20Inquiry"
              >
                Start an inquiry
              </a>
              <TrackedLink
                href="/events"
                event="cta_click"
                label="home_browse_events"
                className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
              >
                Browse events
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
