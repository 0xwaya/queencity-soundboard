import { SEO } from "@/lib/seo";
import type { EventItem } from "@/lib/supabase";

/** Absolute URL for an event page. */
export function eventUrl(eventId: string): string {
  return `${SEO.baseUrl}/events/${eventId}`;
}

/** schema.org Event for one listing. Uses the event's own art and links the offer to the seller. */
export function buildEventJsonLd(event: EventItem) {
  const venue = event.venues;
  // Comedians are usually one person; bands and bills stay groups.
  const performerType = event.category === "comedy" ? "Person" : "PerformingGroup";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${eventUrl(event.id)}#event`,
    url: eventUrl(event.id),
    name: event.title,
    startDate: event.event_date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: venue?.name
      ? {
          "@type": "Place",
          name: venue.name,
          address: {
            "@type": "PostalAddress",
            addressLocality: venue.city,
            addressRegion: venue.state,
            addressCountry: "US",
          },
        }
      : undefined,
    image: [event.hero_image_url ?? `${SEO.baseUrl}/qcs-logo.png`],
    description: event.description ?? `${event.title}${venue?.name ? ` live at ${venue.name}` : ""}.`,
    performer: event.artist_name
      ? { "@type": performerType, name: event.artist_name }
      : undefined,
    organizer: { "@type": "Organization", name: venue?.name ?? SEO.siteName },
    offers: event.ticket_url
      ? {
          "@type": "Offer",
          url: event.ticket_url,
          availability: "https://schema.org/InStock",
          priceCurrency: "USD",
        }
      : undefined,
  };
}
