import type { Metadata } from "next";
import EventsViewToggle from "@/components/events-view-toggle";
import TicketWidget from "@/components/ticket-widget";
import TrackedLink from "@/components/tracked-link";
import { getEventCategories, getPublishedEvents } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import { buildPageMetadata } from "@/lib/seo";

function getVenueSchemaData(event: { venues?: { name?: string | null; city?: string | null; state?: string | null } | null }) {
  return {
    venueName: event.venues?.name ?? null,
    city: event.venues?.city ?? null,
    state: event.venues?.state ?? null,
  };
}

export const metadata: Metadata = buildPageMetadata({
  title: "Upcoming Events in Cincinnati & Northern Kentucky",
  description:
    "Browse the hottest upcoming events across Cincinnati and Northern Kentucky — live music, comedy, and culture in every genre.",
  path: "/events",
  keywords: [
    "upcoming concerts Cincinnati",
    "things to do Cincinnati",
    "Northern Kentucky events",
    "live music calendar Cincinnati",
  ],
});

type EventsPageProps = {
  searchParams?: Promise<{ view?: string; category?: string }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const [resolvedSearchParams, eventsResult, locale] = await Promise.all([
    searchParams,
    getPublishedEvents(),
    getLocale(),
  ]);
  const allEvents = eventsResult.data;
  const eventsError = eventsResult.error;
  const selectedView = resolvedSearchParams?.view;
  const view = selectedView === "compact" ? "compact" : "spotlight";
  const categories = getEventCategories(allEvents);
  const selectedCategory = resolvedSearchParams?.category;
  const events = selectedCategory ? allEvents.filter((event) => event.category === selectedCategory) : allEvents;
  const t =
    locale === "es-ve"
      ? {
          eyebrow: "Lineup pa’ la gozadera",
          title: "Eventos en Cincinnati + NKY",
          subtitle: "Eventos confirmados de música en vivo, comedia y cultura en Cincinnati y el norte de Kentucky.",
          seriesLabel: "Filtro activo",
          allCategories: "Todos",
          featured: "¡Pega’o!",
          live: "En vivo",
          artist: "Artista",
          unavailable: "Los eventos están temporalmente no disponibles. Intenta de nuevo en breve.",
          noEvents: "No hay eventos publicados todavía. Vuelve pronto o",
          submitLink: "envía un evento",
          spotlight: "Brilla’o",
          compact: "Compacto",
          cityHubsLabel: "Hubs locales",
          cityHubCincinnati: "Hub Cincinnati",
          cityHubCovington: "Hub Covington",
        }
      : {
          eyebrow: "Live lineup",
          title: "Events in Cincinnati + NKY",
          subtitle: "Confirmed upcoming music, comedy, and cultural events across Cincinnati and Northern Kentucky.",
          seriesLabel: "Active filter",
          allCategories: "All",
          featured: "Featured",
          live: "Live",
          artist: "Artist",
          unavailable: "Events are temporarily unavailable. Please try again soon.",
          noEvents: "No published events yet. Check back soon or",
          submitLink: "submit an event",
          spotlight: "Spotlight",
          compact: "Compact",
          cityHubsLabel: "City hubs",
          cityHubCincinnati: "Cincinnati Hub",
          cityHubCovington: "Covington Hub",
        };
  const jsonLd =
    events.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: events.map((event, index) => {
            const venue = getVenueSchemaData(event);
            return {
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Event",
                name: event.title,
                startDate: event.event_date,
                eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                eventStatus: "https://schema.org/EventScheduled",
                location: venue.venueName
                  ? {
                      "@type": "Place",
                      name: venue.venueName,
                      address: {
                        "@type": "PostalAddress",
                        addressLocality: venue.city,
                        addressRegion: venue.state,
                        addressCountry: "US",
                      },
                    }
                  : undefined,
                image: ["https://queencitysoundboard.com/qcs-logo.png"],
                description: event.description ?? `${event.title}${venue.venueName ? ` live at ${venue.venueName}.` : "."}`,
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
            };
          }),
        }
      : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
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
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <TrackedLink
            href="/events"
            event="cta_click"
            label="events_filter_all"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              !selectedCategory
                ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200"
                : "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/15"
            }`}
          >
            {t.allCategories}
          </TrackedLink>
          {categories.map((category) => (
            <TrackedLink
              key={category}
              href={`/events?category=${encodeURIComponent(category)}`}
              event="cta_click"
              label={`events_filter_${category}`}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                selectedCategory === category
                  ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200"
                  : "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/15"
              }`}
            >
              {category}
            </TrackedLink>
          ))}
          <EventsViewToggle view={view} labels={{ spotlight: t.spotlight, compact: t.compact }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/85">{t.cityHubsLabel}</p>
          <TrackedLink
            href="/cincinnati"
            event="cta_click"
            label="events_hero_city_hub_cincinnati"
            className="rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            {t.cityHubCincinnati}
          </TrackedLink>
          <TrackedLink
            href="/covington"
            event="cta_click"
            label="events_hero_city_hub_covington"
            className="rounded-full border border-amber-300/35 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/20"
          >
            {t.cityHubCovington}
          </TrackedLink>
        </div>
      </section>

      {eventsError ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          {t.unavailable}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1228] p-6 text-sm text-slate-300">
          {t.noEvents}{" "}
          <TrackedLink href="/partners" event="cta_click" label="events_empty_submit" className="text-fuchsia-300 underline">
            {t.submitLink}
          </TrackedLink>
          .
        </div>
      ) : (
        <div className={`grid gap-5 ${view === "compact" ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {events.map((event, index) => {
            const featured = index === 0;
            return (
            <article
              key={event.id}
              className={`relative overflow-hidden rounded-2xl border bg-[#0b1228] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.35)] ${
                event.is_promoted || featured
                  ? "border-fuchsia-400/60 shadow-[0_0_35px_rgba(217,70,239,0.18)]"
                  : "border-white/10 hover:border-fuchsia-400/30"
              }`}
            >
              {event.hero_image_url ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-45 filter-[contrast(1.18)_saturate(1.12)_brightness(1.03)]"
                    style={{ backgroundImage: `url('${event.hero_image_url}')` }}
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-[#08111f] via-[#08111f]/82 to-[#08111f]/45" />
                </>
              ) : null}
              <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">{event.title}</h2>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    event.is_promoted || featured ? "border-fuchsia-300/60 text-fuchsia-200" : "border-white/20 text-slate-300"
                  }`}
                >
                  {event.is_promoted
                    ? "Promoted"
                    : event.ticketmaster_relevance_rank != null
                      ? "Ticketmaster relevance"
                      : featured
                        ? t.featured
                        : t.live}
                </span>
              </div>

              <p className="text-sm text-slate-300">{new Date(event.event_date).toLocaleString()}</p>
              {event.venues?.name ? (
                <p className="text-sm text-slate-400">
                  {event.venues.name}
                  {event.venues.city ? ` • ${event.venues.city}${event.venues.state ? `, ${event.venues.state}` : ""}` : ""}
                </p>
              ) : null}
              {event.category ? (
                <span className="inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
                  {event.category}
                </span>
              ) : null}
              {event.artist_name ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
                  <span className="text-[10px] font-bold text-fuchsia-300/80">{t.artist}</span>
                  <span className="text-sm font-semibold normal-case tracking-normal text-white">{event.artist_name}</span>
                </div>
              ) : null}
              {event.description ? <p className="text-sm text-slate-300">{event.description}</p> : null}
              <TicketWidget
                eventTitle={event.title}
                eventTicketUrl={event.ticket_url}
                eventId={event.id}
                locale={locale}
                salesDisabled={false}
              />
              </div>
            </article>
          );
          })}
        </div>
      )}
      </div>
    </>
  );
}

