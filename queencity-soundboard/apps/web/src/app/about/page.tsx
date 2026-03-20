import { getLocale } from "@/lib/i18n";

export default async function AboutPage() {
  const locale = await getLocale();
  const t =
    locale === "es-ve"
      ? {
          eyebrow: "¿Quiénes somos, pues?",
          title: "Hecho pa’ rumbear con cultura",
          body:
            "QueenCity Soundboard es la movida fan-first que conecta talento venezolano y latino con el Midwest. Aquí hay pura experiencia premium, entradas sin rollo y drops de merch que están brutales. ¡Pa’ que vaciles como en Caracas, pero en Kentucky!",
          cards: [
            { title: "Eventos en vivo", body: "Showcases, pop-ups y colaboraciones que vienen con todo el flow criollo. ¡No te lo pierdas, pana!" },
            { title: "Checkout rápido", body: "Compra desde el cel, facilito y sin dar tantas vueltas. Aquí no hay cola, solo gozo." },
            { title: "Drops de merch", body: "Capsulitas limitadas con artistas, panas y momentos que quedan pa’ la historia. ¡Corre que vuelan!" },
          ],
        }
      : {
          eyebrow: "About Queen City",
          title: "Built for culture-driven nights",
          body:
            "QueenCity Soundboard is a fan-first event platform connecting Venezuelan and Latin music talent with Midwest audiences through premium live experiences, frictionless ticketing, and curated merch drops.",
          cards: [
            { title: "Live Events", body: "Discover upcoming showcases, pop-ups, and collaborations." },
            { title: "Fast Checkout", body: "Mobile-first ticket flow using proven third-party ticketing providers." },
            { title: "Merch Drops", body: "Limited capsules built around artists, venues, and event moments." },
          ],
        };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-br from-[#0f1630] via-[#0b1228] to-[#070b17] p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{t.body}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {t.cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-slate-100">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{card.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
