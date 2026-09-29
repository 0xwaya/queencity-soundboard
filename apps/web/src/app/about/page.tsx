import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "QueenCity Soundboard is Cincinnati and Northern Kentucky's discovery hub for the hottest live events, across every genre.",
  path: "/about",
  keywords: ["about QueenCity Soundboard", "Cincinnati events platform", "Northern Kentucky live events"],
});

export default async function AboutPage() {
  const locale = await getLocale();
  const t =
    locale === "es"
      ? {
          eyebrow: "¿Quiénes somos?",
          title: "El soundboard de la Queen City",
          body:
            "QueenCity Soundboard es la guía local de música en vivo, comedia y cultura en Cincinnati y el norte de Kentucky. Explora el calendario y encuentra enlaces oficiales para comprar entradas.",
          cards: [
            { title: "Descubre eventos", body: "Un calendario local de todos los géneros, desde grandes conciertos hasta salas de barrio y eventos comunitarios." },
            { title: "Compra directamente", body: "Encuentra enlaces oficiales de entradas y completa tu compra con el recinto o su plataforma de venta autorizada." },
            { title: "Conecta con la escena", body: "Recintos, artistas y promotores pueden enviar eventos, destacar sus proyectos o asociarse con nosotros." },
          ],
        }
      : {
          eyebrow: "About Queen City",
          title: "The soundboard for the Queen City",
          body:
            "QueenCity Soundboard is a local guide to live music, comedy, and culture across Cincinnati and Northern Kentucky. Explore the calendar and find official ticket links for your next night out.",
          cards: [
            { title: "Discover events", body: "A locally curated calendar across genres, from major concerts to neighborhood rooms and community events." },
            { title: "Go straight to tickets", body: "Find official ticket links and continue with the venue or its ticketing partner." },
            { title: "Connect with the scene", body: "Venues, artists, and promoters can submit events, feature their work, or partner with us." },
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
