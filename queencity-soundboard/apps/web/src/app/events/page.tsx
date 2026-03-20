import EventsViewToggle from "@/components/events-view-toggle";
import TicketWidget from "@/components/ticket-widget";
import { getPublishedEvents } from "@/lib/data";
import { getLocale } from "@/lib/i18n";

type EventsPageProps = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const [resolvedSearchParams, events, locale] = await Promise.all([
    searchParams,
    getPublishedEvents(),
    getLocale(),
  ]);
  const selectedView = resolvedSearchParams?.view;
  const view = selectedView === "compact" ? "compact" : "spotlight";
  const t =
    locale === "es-ve"
      ? {
          eyebrow: "Lineup pa’ la gozadera",
          title: "After Dark Sessions",
          subtitle: "Artistas latinos en el spotlight. Sonido pro, compra sin estrés. ¡Asegura tu entrada, mi pana!",
          seriesLabel: "El flow de la serie",
          seriesTitle: "Madison Theater • Covington, KY",
          seriesMeta: "Puertas 7:00 PM • Show 8:00 PM (¡Llega temprano pa’ agarrar puesto!)",
          tags: ["To’ el mundo", "After Dark", "Acústico", "Latino", "VIP"],
          featured: "¡Pega’o!",
          mock: "Demo, pues",
          live: "En vivo",
          artist: "Artista",
          venue: "Madison Theater • Covington, KY",
          publishHint:
            "Publica eventos en Supabase pa’ quitar estas tarjetas demo. El botón usa NEXT_PUBLIC_TICKETING_WIDGET_URL cuando esté listo. ¡No seas lento!",
          spotlight: "Brilla’o",
          compact: "Compacto",
        }
      : {
          eyebrow: "Live lineup",
          title: "After Dark Sessions",
          subtitle: "Spotlighted Latin artists. Premium sound. Seamless checkout. Secure your seat in seconds.",
          seriesLabel: "Series Focus",
          seriesTitle: "Madison Theater • Covington, KY",
          seriesMeta: "Doors 7:00 PM • Showtime 8:00 PM",
          tags: ["All", "After Dark", "Acoustic", "Latin", "VIP"],
          featured: "Featured",
          mock: "Mock Event",
          live: "Live",
          artist: "Artist",
          venue: "Madison Theater • Covington, KY",
          publishHint:
            "Publish events in Supabase to replace these mock cards. Ticket CTA uses NEXT_PUBLIC_TICKETING_WIDGET_URL when set.",
          spotlight: "Spotlight",
          compact: "Compact",
        };
  const jsonLd =
    events.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: events.map((event, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Event",
              name: event.title,
              startDate: event.event_date,
              eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
              eventStatus: "https://schema.org/EventScheduled",
              location: {
                "@type": "Place",
                name: event.venues?.name ?? "Madison Theater",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: event.venues?.city ?? "Covington",
                  addressRegion: event.venues?.state ?? "KY",
                  addressCountry: "US",
                },
              },
              image: ["https://queencitysoundboard.com/qcs-logo.png"],
              description:
                event.description ?? `${event.title} live at ${event.venues?.name ?? "Madison Theater"}.`,
              performer: event.artist_name ? { "@type": "PerformingGroup", name: event.artist_name } : undefined,
              offers: event.ticket_url
                ? {
                    "@type": "Offer",
                    url: event.ticket_url,
                    availability: "https://schema.org/InStock",
                    priceCurrency: "USD",
                  }
                : undefined,
            },
          })),
        }
      : null;

  const mockEvents = [
    {
      title: "Caracas Unplugged: After Dark Sessions",
      artist: "Franco De Vita",
      dateLabel: "May 16 • 8:00 PM",
      description: "Candlelit storytelling, acoustic classics, and an intimate fan-forward set.",
    },
    {
      title: "Bolero Nights: After Dark Sessions",
      artist: "Rudy La Escala",
      dateLabel: "May 30 • 8:00 PM",
      description: "Romantic boleros, slow-burn grooves, and a close-up theater experience.",
    },
    {
      title: "Alma Acústica: Intimate Sessions",
      artist: "Elena Rose",
      dateLabel: "June 6 • 8:00 PM",
      description: "Soulful, stripped-down sets with candlelight and premium sound.",
    },
    {
      title: "Merenhouse Unplugged: After Dark Energy Session",
      artist: "Proyecto Uno",
      dateLabel: "June 27 • 8:00 PM",
      description: "Merengue + house crossover energy with an acoustic twist.",
    },
  ];

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-linear-to-br from-[#0f1630] via-[#0b1228] to-[#070b17] p-7 md:p-11">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">{t.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">{t.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0e1732] px-5 py-4 text-sm text-slate-300">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-300/80">{t.seriesLabel}</p>
            <p className="mt-2 text-base font-semibold text-white">{t.seriesTitle}</p>
            <p className="mt-1 text-xs text-slate-400">{t.seriesMeta}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {t.tags.map((label) => (
            <span
              key={label}
              className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200"
            >
              {label}
            </span>
          ))}
          <EventsViewToggle view={view} labels={{ spotlight: t.spotlight, compact: t.compact }} />
        </div>
      </section>

      {events.length === 0 ? (
        <div className={`grid gap-5 ${view === "compact" ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {mockEvents.map((event, index) => {
            const featured = index === 0;
            return (
              <article
                key={event.title}
                className={`space-y-4 rounded-2xl border bg-[#0b1228] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.35)] ${
                  featured
                    ? "border-fuchsia-400/60 shadow-[0_0_35px_rgba(217,70,239,0.18)]"
                    : "border-white/10 hover:border-fuchsia-400/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold tracking-tight text-slate-100">{event.title}</h2>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      featured ? "border-fuchsia-300/60 text-fuchsia-200" : "border-white/20 text-slate-300"
                    }`}
                  >
                    {featured ? t.featured : t.mock}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{event.dateLabel}</p>
                <p className="text-sm text-slate-400">{t.venue}</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
                  <span className="text-[10px] font-bold text-fuchsia-300/80">{t.artist}</span>
                  <span className="text-sm font-semibold normal-case tracking-normal text-white">{event.artist}</span>
                </div>
                <p className="text-sm text-slate-300">{event.description}</p>
                <TicketWidget eventTitle={event.title} locale={locale} />
              </article>
            );
          })}
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1228] p-6 text-sm text-slate-300">
            {t.publishHint}
            <code className="mx-1 rounded bg-white/10 px-1">NEXT_PUBLIC_TICKETING_WIDGET_URL</code>.
          </div>
        </div>
      ) : (
        <div className={`grid gap-5 ${view === "compact" ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {events.map((event, index) => {
            const featured = index === 0;
            return (
            <article
              key={event.id}
              className={`space-y-4 rounded-2xl border bg-[#0b1228] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.35)] ${
                featured
                  ? "border-fuchsia-400/60 shadow-[0_0_35px_rgba(217,70,239,0.18)]"
                  : "border-white/10 hover:border-fuchsia-400/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">{event.title}</h2>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    featured ? "border-fuchsia-300/60 text-fuchsia-200" : "border-white/20 text-slate-300"
                  }`}
                >
                  {featured ? t.featured : t.live}
                </span>
              </div>

              <p className="text-sm text-slate-300">{new Date(event.event_date).toLocaleString()}</p>
              {event.venues?.name ? (
                <p className="text-sm text-slate-400">
                  {event.venues.name}
                  {event.venues.city ? ` • ${event.venues.city}${event.venues.state ? `, ${event.venues.state}` : ""}` : ""}
                </p>
              ) : null}
              {event.artist_name ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
                  <span className="text-[10px] font-bold text-fuchsia-300/80">{t.artist}</span>
                  <span className="text-sm font-semibold normal-case tracking-normal text-white">{event.artist_name}</span>
                </div>
              ) : null}
              {event.description ? <p className="text-sm text-slate-300">{event.description}</p> : null}
              <TicketWidget eventTitle={event.title} eventTicketUrl={event.ticket_url} locale={locale} />
            </article>
          );
          })}
        </div>
      )}
      </div>
    </>
  );
}
