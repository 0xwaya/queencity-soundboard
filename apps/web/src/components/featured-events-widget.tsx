import EventBackdrop from "@/components/event-backdrop";
import EventEngagement from "@/components/event-engagement";
import TrackedLink from "@/components/tracked-link";
import { getSponsoredEvents } from "@/lib/data";
import type { EventItem } from "@/lib/supabase";

type Props = {
  events: EventItem[];
  surface?: string;
  locale?: "en" | "es";
};

export default function FeaturedEventsWidget({ events, surface = "home", locale = "en" }: Props) {
  const sponsored = getSponsoredEvents(events);
  if (sponsored.length === 0) return null;

  return (
    <section aria-label={locale === "es" ? "Eventos patrocinados" : "Sponsored events"} className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">
        {locale === "es" ? "Eventos patrocinados" : "Sponsored events"}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {sponsored.map((event) => {
          const campaignId = `${event.id}:${event.promoted_until}`;
          return (
            <EventEngagement key={event.id} event="sponsored_impression" eventId={event.id} surface={surface} campaignId={campaignId}>
              <article className="relative h-full overflow-hidden rounded-lg border border-amber-300/30 p-5">
                <EventBackdrop src={event.hero_image_url} opacity={30} />
                <div className="relative z-10 space-y-3">
                  <p className="text-xs font-semibold uppercase text-amber-200">
                    {locale === "es" ? "Patrocinado" : "Sponsored"}
                  </p>
                  <h3 className="wrap-break-word text-lg font-bold text-white">
                    <TrackedLink
                      href={`/events/${event.id}`}
                      event="sponsor_click"
                      properties={{ event_id: event.id, surface, campaign_id: campaignId }}
                      className="hover:text-amber-200"
                    >
                      {event.title}
                    </TrackedLink>
                  </h3>
                  <p className="text-sm text-slate-200">{event.venues?.name}</p>
                  <time dateTime={event.event_date} className="block text-sm text-slate-300">
                    {new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York",
                    }).format(new Date(event.event_date))}
                  </time>
                </div>
              </article>
            </EventEngagement>
          );
        })}
      </div>
    </section>
  );
}
