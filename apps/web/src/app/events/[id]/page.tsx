import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventBackdrop from "@/components/event-backdrop";
import StickyBuyBar from "@/components/sticky-buy-bar";
import TicketWidget from "@/components/ticket-widget";
import TrackedExternalLink from "@/components/tracked-external-link";
import { goHref } from "@/lib/go";
import ResaleLinks from "@/components/resale-links";
import Stay22Map from "@/components/stay22-map";
import { isNewsletterEnabled } from "@/lib/newsletter";
import NewsletterSignup from "@/components/newsletter-signup";
import { getPublishedEventById, getPublishedEvents, getSimilarEvents } from "@/lib/data";
import { buildEventJsonLd } from "@/lib/event-json-ld";
import { safeJsonLd } from "@/lib/json-ld";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import type { EventItem } from "@/lib/supabase";
import { formatEventDate, formatEventDateTime } from "@/lib/time";

// Rendered on first request, then cached and refreshed every 5 minutes. This needs the root
// layout to stay free of cookies() (case study #11); see the hotfix in PR #4.
export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return [];
}

function venueLine(event: EventItem): string {
  const venue = event.venues;
  if (!venue?.name) return "";
  return [venue.name, venue.city, venue.state].filter(Boolean).join(", ");
}

function eventDescription(event: EventItem): string {
  if (event.description) return event.description.slice(0, 300);
  const venue = venueLine(event);
  return `${event.title}${venue ? ` at ${venue}` : ""} on ${formatEventDate(event.event_date)}. Date, venue and official ticket link from QueenCity Soundboard.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: event } = await getPublishedEventById(id);
  if (!event) return { title: "Event not found", robots: { index: false, follow: true } };

  const base = buildPageMetadata({
    title: `${event.title} tickets, ${formatEventDate(event.event_date)}`,
    description: eventDescription(event),
    path: `/events/${event.id}`,
    keywords: [event.title, event.artist_name, event.venues?.name ?? "", `${event.category ?? "live"} Cincinnati`].filter(Boolean),
  });
  if (!event.hero_image_url) return base;
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: event.hero_image_url, alt: event.title }] },
    twitter: { ...base.twitter, images: [event.hero_image_url] },
  };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const [{ data: event }, { data: allEvents }] = await Promise.all([getPublishedEventById(id), getPublishedEvents()]);
  if (!event) notFound();

  const similar = getSimilarEvents(event, allEvents);
  const stickyHref = goHref(event.id, event.ticket_url, "sticky");
  const venue = venueLine(event);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            buildBreadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Events", path: "/events" },
              { name: event.title, path: `/events/${event.id}` },
            ]),
          ),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(buildEventJsonLd(event)) }} />

      <div className="space-y-6 pb-24 md:pb-0">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-300">
          <Link href="/events" className="text-cyan-200 hover:underline">
            All events
          </Link>
          {event.category ? (
            <>
              {" / "}
              <Link href={`/events/c/${encodeURIComponent(event.category)}`} className="text-cyan-200 hover:underline">
                {event.category}
              </Link>
            </>
          ) : null}
        </nav>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1228] p-6 md:p-10">
          <EventBackdrop src={event.hero_image_url} opacity={50} priority />
          <div className="relative z-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
            <div className="min-w-0">
              {event.is_promoted ? (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Sponsored</p>
              ) : null}
              {event.category ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-200">{event.category}</p>
              ) : null}
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">{event.title}</h1>
              <time dateTime={event.event_date} className="mt-4 block text-base font-semibold text-slate-100">
                {formatEventDateTime(event.event_date)}
              </time>
              {venue ? <p className="mt-1 text-sm text-slate-200">{venue}</p> : null}
              {event.artist_name && event.artist_name !== event.title ? (
                <p className="mt-3 text-sm text-slate-200">
                  <span className="font-semibold text-fuchsia-200">Artist:</span> {event.artist_name}
                </p>
              ) : null}
            </div>
            <div className="space-y-3">
              <TicketWidget
                eventTitle={event.title}
                eventTicketUrl={event.ticket_url}
                eventId={event.id}
                placement="event_page"
              />
              <ResaleLinks eventId={event.id} />
            </div>
          </div>
        </section>

        {event.description ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-white">About this show</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">{event.description}</p>
          </section>
        ) : null}

        <Stay22Map event={event} />

        {isNewsletterEnabled() ? <NewsletterSignup placement="event_page" /> : null}

        {similar.length > 0 ? (
          <section className="space-y-4" aria-labelledby="similar-heading">
            <h2 id="similar-heading" className="text-xl font-extrabold tracking-tight text-white">
              More like this in the next two weeks
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {similar.map((item) => {
                const href = goHref(item.id, item.ticket_url, "similar");
                return (
                  <article key={item.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1228] p-5">
                    <EventBackdrop src={item.hero_image_url} opacity={30} />
                    <div className="relative z-10 space-y-2">
                      <h3 className="text-base font-bold text-white">
                        <Link href={`/events/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-300">
                        {formatEventDateTime(item.event_date)}
                        {item.venues?.name ? ` · ${item.venues.name}` : ""}
                      </p>
                      {href ? (
                        <TrackedExternalLink
                          href={href}
                          event="ticket_click"
                          trackProps={{ event_id: item.id, placement: "similar" }}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className="inline-flex rounded-md bg-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-400"
                        >
                          Tickets
                        </TrackedExternalLink>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {stickyHref ? (
        <StickyBuyBar
          href={stickyHref}
          eventId={event.id}
          eventTitle={event.title}
          dateLabel={`${formatEventDateTime(event.event_date)}${event.venues?.name ? ` · ${event.venues.name}` : ""}`}
        />
      ) : null}
    </>
  );
}
