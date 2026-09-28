import type { Metadata } from "next";
import { getActiveMerch } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Official Event Merch Drops",
  description:
    "Shop limited-run merch connected to QueenCity Soundboard artists, events, and local culture nights.",
  path: "/merch",
  keywords: [
    "concert merch Cincinnati",
    "live music merch Cincinnati",
    "event merch drops Kentucky",
    "QueenCity Soundboard merch",
  ],
});

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default async function MerchPage() {
  const merchResult = await getActiveMerch();
  const merch = merchResult.data;
  const locale = await getLocale();
  const t =
    locale === "es"
      ? {
          eyebrow: "Merch pa’ la pinta",
          title: "Merch",
          subtitle: "Drops limitados pa’ que te vistas como es, conectado a noches y momentos de artistas. ¡Póntelo y saca pecho!",
          empty: "El merch viene pronto, así que pilas. El primer drop lo soltamos por el canal de eventos. ¡No te quedes sin el tuyo!",
          stock: "disponible (apúrate)",
          unavailable: "El merch está temporalmente no disponible. Intenta de nuevo en breve.",
        }
      : {
          eyebrow: "Fan gear",
          title: "Merch",
          subtitle: "Limited-run drops tied to event nights and artist moments.",
          empty: "Merch is coming soon. First drop will be announced in the events channel.",
          stock: "in stock",
          unavailable: "Merch is temporarily unavailable. Please try again soon.",
        };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-br from-[#0f1630] via-[#0b1228] to-[#070b17] p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-300">{t.subtitle}</p>
      </section>

      {merchResult.error ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-6 text-sm text-amber-200">
          {t.unavailable}
        </div>
      ) : merch.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">{t.empty}</div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {merch.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold text-slate-100">{item.name}</h2>
              {item.description ? <p className="mt-2 text-sm text-slate-300">{item.description}</p> : null}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-base font-semibold text-fuchsia-300">{formatPrice(item.price_cents)}</p>
                <p className="text-xs text-slate-400">
                  {item.inventory_count} {t.stock}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
