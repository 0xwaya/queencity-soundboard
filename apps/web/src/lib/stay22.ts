/**
 * Stay22 hotel map (case study #17). Off until NEXT_PUBLIC_STAY22_AID is set, and only for
 * big-room venues where fans travel in (arenas, stadiums, the Riverbend campus).
 */
const BIG_VENUE_PATTERN =
  /\b(arena|stadium|coliseum|ball\s?park|riverbend|heritage bank center|andrew j\.? brady|megacorp pavilion)\b/i;

export function stay22Aid(): string | null {
  return process.env.NEXT_PUBLIC_STAY22_AID?.trim() || null;
}

export function isStay22Venue(venueName: string | null | undefined): boolean {
  return Boolean(venueName && BIG_VENUE_PATTERN.test(venueName));
}

/** YYYY-MM-DD in Cincinnati time. */
function easternDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

type MapEvent = { id: string; event_date: string; venues?: { name: string; city: string | null; state: string | null } | null };

export function buildStay22MapUrl(event: MapEvent, aid = stay22Aid()): string | null {
  const venue = event.venues;
  if (!aid || !venue || !isStay22Venue(venue.name)) return null;
  const start = new Date(event.event_date);
  if (Number.isNaN(start.getTime())) return null;
  const params = new URLSearchParams({
    aid,
    address: [venue.name, venue.city, venue.state].filter(Boolean).join(", "),
    checkin: easternDate(start),
    checkout: easternDate(new Date(start.getTime() + 24 * 60 * 60 * 1000)),
    campaign: `event_${event.id}`.slice(0, 64),
  });
  return `https://www.stay22.com/embed/gm?${params.toString()}`;
}
