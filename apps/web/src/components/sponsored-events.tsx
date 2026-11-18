import Link from "next/link";
import EventBackdrop from "@/components/event-backdrop";
import { getSponsoredEvents } from "@/lib/data";
import { FEATURED_EVENT_PLACEMENT } from "@/lib/placements";
import type { EventItem } from "@/lib/supabase";
import { formatEventDateTime } from "@/lib/time";

type Props = { events: EventItem[]; locale?: "en" | "es" };

/** Clearly labeled sponsored slots (case study #15, ported from the copilot/add-affiliate-link-to-event branch). */
export default function SponsoredEvents({ events, locale = "en" }: Props) {
  const sponsored = getSponsoredEvents(events, FEATURED_EVENT_PLACEMENT.maxActive);
  if (sponsored.length === 0) return null;
  const label = locale === "es" ? "Patrocinado" : "Sponsored";

  return (
    <section aria-label={locale === "es" ? "Eventos patrocinados" : "Sponsored events"} className="space-y-3">
      <div className="grid gap-4 md:grid-cols-3">
        {sponsored.map((event) => (
          <article key={event.id} className="relative overflow-hidden rounded-2xl border border-amber-300/40 bg-[#0b1228] p-5">
            <EventBackdrop src={event.hero_image_url} opacity={30} />
            <div className="relative z-10 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">{label}</p>
              <h3 className="text-lg font-bold text-white">
                <Link href={`/events/${event.id}`} className="hover:text-amber-200 hover:underline">
                  {event.title}
                </Link>
              </h3>
              <p className="text-sm text-slate-200">
                {formatEventDateTime(event.event_date)}
                {event.venues?.name ? ` · ${event.venues.name}` : ""}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="text-[11px] text-slate-400">
        {locale === "es" ? "Los listados patrocinados son pagados." : "Sponsored listings are paid placements."}{" "}
        <Link href="/partners" className="underline hover:text-slate-200">
          {locale === "es" ? "Destaca tu evento" : "Feature your event"}
        </Link>
      </p>
    </section>
  );
}
