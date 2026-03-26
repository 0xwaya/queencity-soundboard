export default function Hero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-10">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Premium Countertops. Fast Install. Built for Cincinnati.
        </h1>
        <p className="text-muted mt-4 text-lg">
          We source premium slabs from 5 top suppliers and fabricate custom 3cm countertops with a
          3–5 day turnaround from deposit to install.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-panel border border-border rounded-full text-sm">3–5 Day Install</span>
          <span className="px-3 py-1 bg-panel border border-border rounded-full text-sm">1-Year Install Guarantee</span>
          <span className="px-3 py-1 bg-panel border border-border rounded-full text-sm">No Material Warranty (Supplier)</span>
        </div>
        <div className="mt-8 flex gap-4">
          <button className="bg-accent hover:bg-accentDark text-white px-5 py-3 rounded-md font-semibold transition hover:-translate-y-0.5 hover:shadow-xl">
            Book Measure
          </button>
          <button className="border border-border px-5 py-3 rounded-md font-semibold hover:border-accent transition hover:-translate-y-0.5">
            View Slabs
          </button>
        </div>
      </div>
      <div className="bg-panel border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
        <div className="text-sm text-muted">DBA Rebrand Coming Soon</div>
        <div className="text-2xl font-semibold mt-2">Urban Stone Collective</div>
        <div className="text-muted mt-2">Final brand reveal after launch.</div>
        <div className="mt-6 rounded-lg bg-surface border border-border p-4">
          <div className="text-[10px] tracking-[0.2em] text-accent uppercase">Launch Posture</div>
          <div className="mt-2 text-xl font-semibold">
            Luxury visuals, contractor-grade responsiveness
          </div>
          <p className="text-muted mt-2 text-sm">
            Deployable baseline while the UrbanStone brand kit rolls out.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span className="w-6 h-3 rounded-sm border border-border" style={{ background: "#0A0A0A" }} />
            <span className="w-6 h-3 rounded-sm border border-border" style={{ background: "#C9A96E" }} />
            <span className="w-6 h-3 rounded-sm border border-border" style={{ background: "#E2C896" }} />
            <span className="text-[10px] uppercase tracking-[0.2em]">UrbanStone Sample</span>
          </div>
        </div>
      </div>
    </section>
  );
}
