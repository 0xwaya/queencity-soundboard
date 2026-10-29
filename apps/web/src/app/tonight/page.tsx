import type { Metadata } from "next";
import Link from "next/link";
import EventBackdrop from "@/components/event-backdrop";
import TrackedExternalLink from "@/components/tracked-external-link";
import { getPublishedEvents, getTonightEvents } from "@/lib/data";
import { goHref } from "@/lib/go";
import { buildPageMetadata } from "@/lib/seo";
import { AFFILIATE_DISCLOSURE } from "@/lib/site";
import { formatEventDate, formatEventDateTime } from "@/lib/time";

// Today's list changes through the day; refresh every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Tonight in Cincinnati: shows and tickets",
  description: "Tonight's live music, comedy and culture in Cincinnati and Northern Kentucky, with official ticket links.",
  path: "/tonight",
  keywords: ["things to do tonight Cincinnati", "concerts tonight Cincinnati", "comedy tonight Cincinnati", "Northern Kentucky tonight"],
});

/**
 * Case study #10: the shortest TikTok-to-ticket path. The bio link is /tonight?src=tiktok;
 * src/proxy.ts keeps the source in a 7-day cookie and /go/[id] passes it to Impact as subId3.
 */
export default async function TonightPage() {
  const { data: allEvents, error } = await getPublishedEvents();
  const { day, isToday, events } = getTonightEvents(allEvents);
  const heading = isToday ? "Tonight in the Queen City" : `Next up: ${events[0] ? formatEventDate(events[0].event_date) : ""}`;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#0b1228] p-6 md:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">Cincinnati + NKY</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-5xl">{heading}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          {isToday
            ? "Every show we're tracking today, with the official ticket link."
            : "Nothing left on the calendar today, so here are the next shows."}
        </p>
      </section>

      {error ? (
        <p className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-5 text-sm text-amber-200">Events are unavailable right now.</p>
      ) : events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-300">
          No shows found. <Link href="/events" className="text-fuchsia-300 underline">Browse all events</Link>.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" data-day={day}>
          {events.map((event, index) => {
            const href = goHref(event.id, event.ticket_url, "tonight");
            return (
              <li key={event.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1228] p-5">
                <EventBackdrop src={event.hero_image_url} opacity={30} priority={index < 2} />
                <div className="relative z-10 space-y-2">
                  {event.category ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">{event.category}</p>
                  ) : null}
                  <h2 className="text-lg font-bold text-white">
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-slate-200">
                    {formatEventDateTime(event.event_date)}
                    {event.venues?.name ? ` · ${event.venues.name}` : ""}
                  </p>
                  {href ? (
                    <TrackedExternalLink
                      href={href}
                      event="ticket_click"
                      trackProps={{ event_id: event.id, placement: "tonight" }}
                      target="_blank"
                      rel="sponsored noopener"
                      className="qcs-button-3d inline-flex rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-400"
                    >
                      Buy tickets
                    </TrackedExternalLink>
                  ) : (
                    <Link href={`/events/${event.id}`} className="inline-flex text-sm font-semibold text-cyan-200 underline">
                      Details
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-slate-400">{AFFILIATE_DISCLOSURE.en}</p>
    </div>
  );
}
