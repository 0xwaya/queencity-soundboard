import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import EventBackdrop from "@/components/event-backdrop";
import EventEngagement from "@/components/event-engagement";
import TicketWidget from "@/components/ticket-widget";
import { getPublishedEvents, getSponsoredEvents, isPublicUpcomingEvent } from "@/lib/data";
import { getLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

const getEvent = cache(async (id: string) => {
  if (!z.string().uuid().safeParse(id).success) return undefined;
  const result = await getPublishedEvents();
  if (result.error) throw new Error(result.error);
  return result.data.find((event) => event.id === id && event.status === "published" && isPublicUpcomingEvent(event));
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event unavailable", robots: { index: false, follow: false } };
  return buildPageMetadata({
    title: event.title,
    description: event.description ?? `${event.title}${event.venues?.name ? ` at ${event.venues.name}` : ""}. Event details and ticket links.`,
    path: `/events/${event.id}`,
  });
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const [event, locale] = await Promise.all([getEvent(id), getLocale()]);
  if (!event) notFound();
  const sponsored = getSponsoredEvents([event]).length > 0;
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "America/New_York", timeZoneName: "short",
  }).format(new Date(event.event_date));

  return (
    <div className="space-y-6">
      <Link href="/events" className="text-sm text-cyan-200 hover:underline">
        {locale === "es" ? "Todos los eventos" : "All events"}
      </Link>
      <EventEngagement event="event_view" eventId={event.id} surface="event_detail">
        <section className="relative overflow-hidden py-8 md:py-12">
          <EventBackdrop src={event.hero_image_url} opacity={30} priority />
          <div className="relative z-10 max-w-3xl px-5">
            {sponsored ? <p className="mb-3 text-xs font-semibold uppercase text-amber-200">{locale === "es" ? "Patrocinado" : "Sponsored"}</p> : null}
            <h1 className="wrap-break-word text-2xl font-bold text-white md:text-4xl">{event.title}</h1>
            <time dateTime={event.event_date} className="mt-4 block text-sm text-slate-200">{date}</time>
            {event.venues ? (
              <p className="mt-2 text-sm text-slate-300">{event.venues.name}{event.venues.city ? `, ${event.venues.city}` : ""}{event.venues.state ? `, ${event.venues.state}` : ""}</p>
            ) : null}
          </div>
        </section>
      </EventEngagement>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-4">
          {event.artist_name ? <h2 className="wrap-break-word text-xl font-semibold text-slate-100">{event.artist_name}</h2> : null}
          {event.description ? <p className="whitespace-pre-line wrap-break-word text-sm leading-7 text-slate-300">{event.description}</p> : null}
        </div>
        <TicketWidget eventId={event.id} eventTitle={event.title} eventTicketUrl={event.ticket_url} surface="event_detail" locale={locale} />
      </div>
    </div>
  );
}