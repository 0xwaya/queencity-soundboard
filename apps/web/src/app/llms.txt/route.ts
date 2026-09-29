import { getPublishedEvents } from "@/lib/data";
import { SEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * llms.txt: a plain-text site summary for AI agents and answer engines that prefer
 * structured prose over crawling rendered HTML.
 */
export async function GET() {
  const { data: events } = await getPublishedEvents();
  const upcoming = events.slice(0, 25);

  const eventLines = upcoming.map((event) => {
    const date = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeZone: "America/New_York",
    }).format(new Date(event.event_date));
    const venue = event.venues?.name ? ` — ${event.venues.name}` : "";
    const city = event.venues?.city ? `, ${event.venues.city}` : "";
    return `- ${date}: ${event.title}${venue}${city}`;
  });

  const body = `# ${SEO.siteName}

> ${SEO.defaultDescription}

${SEO.siteName} is an events discovery portal for Cincinnati, Ohio and Northern Kentucky
(Covington, Newport). It lists live music, comedy, theatre, sports and community events
across every genre, and links to official ticket sellers.

## Coverage
${SEO.serviceAreas.map((area) => `- ${area.name}`).join("\n")}

## Key pages
- ${SEO.baseUrl}/ — homepage and ticket spotlight
- ${SEO.baseUrl}/events — full upcoming event calendar
- ${SEO.baseUrl}/cincinnati — Cincinnati, Ohio event guide
- ${SEO.baseUrl}/covington — Covington, Kentucky event guide
- ${SEO.baseUrl}/partners — submit an event or request a promoted placement
- ${SEO.baseUrl}/merch — active merchandise catalog
- ${SEO.baseUrl}/about — about the portal

## Upcoming events${eventLines.length ? `\n${eventLines.join("\n")}` : "\n- No published events at this time."}

## Contact
- Email: ${SEO.contactEmail}

## Disclosure
Some ticket links are affiliate links and may earn a commission at no extra cost to the buyer.
Paid placements are labeled "Promoted".

## Notes
- Ticketmaster events are synchronized twice daily. Other listings may be manually curated or submitted for review; submissions are not published automatically.
- Ticket purchases are completed on the official ticket seller's site, not on this portal.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
