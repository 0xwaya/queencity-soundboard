import { getActiveMerch } from "@/lib/data";

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default async function MerchPage() {
  const merch = await getActiveMerch();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-300/80">Fan gear</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">Merch</h1>
        <p className="mt-2 text-sm text-slate-300">Limited-run drops tied to event nights and artist moments.</p>
      </section>

      {merch.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-6 text-slate-300">
          Merch is coming soon. First drop will be announced in the events channel.
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {merch.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
              <h2 className="text-lg font-bold text-slate-100">{item.name}</h2>
              {item.description ? <p className="mt-2 text-sm text-slate-300">{item.description}</p> : null}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-base font-semibold text-fuchsia-300">{formatPrice(item.price_cents)}</p>
                <p className="text-xs text-slate-400">{item.inventory_count} in stock</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
