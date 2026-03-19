import TicketWidget from "@/components/ticket-widget";
import { getPublishedEvents } from "@/lib/data";

export default async function EventsPage() {
  const events = await getPublishedEvents();
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
      title: "Noche Acústica: Leyendas y Velas",
      artist: "José Feliciano",
      dateLabel: "May 23 • 8:00 PM",
      description: "Legendary songs, warm strings, and a velvet-lit night of classics.",
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
      <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">Live lineup</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">Events</h1>
        <p className="mt-2 text-sm text-slate-300">Tap any event and complete checkout in a few clicks.</p>
      </div>

      {events.length === 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {mockEvents.map((event) => (
            <article key={event.title} className="space-y-4 rounded-2xl border border-white/10 bg-[#0b1228] p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">{event.title}</h2>
                <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Mock Event
                </span>
              </div>
              <p className="text-sm text-slate-300">{event.dateLabel}</p>
              <p className="text-sm text-slate-400">Madison Theater • Covington, KY</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
                <span className="text-[10px] font-bold text-fuchsia-300/80">Artist</span>
                <span className="text-sm font-semibold normal-case tracking-normal text-white">{event.artist}</span>
              </div>
              <p className="text-sm text-slate-300">{event.description}</p>
              <TicketWidget eventTitle={event.title} />
            </article>
          ))}
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1228] p-6 text-sm text-slate-300">
            Publish events in Supabase to replace these mock cards. Ticket CTA uses
            <code className="mx-1 rounded bg-white/10 px-1">NEXT_PUBLIC_TICKETING_WIDGET_URL</code> when set.
          </div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="space-y-4 rounded-2xl border border-white/10 bg-[#0b1228] p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">{event.title}</h2>
                <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Live
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
                  <span className="text-[10px] font-bold text-fuchsia-300/80">Artist</span>
                  <span className="text-sm font-semibold normal-case tracking-normal text-white">{event.artist_name}</span>
                </div>
              ) : null}
              {event.description ? <p className="text-sm text-slate-300">{event.description}</p> : null}
              <TicketWidget eventTitle={event.title} eventTicketUrl={event.ticket_url} />
            </article>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
