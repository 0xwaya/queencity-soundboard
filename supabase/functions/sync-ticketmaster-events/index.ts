import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const rawTicketmasterApiKey = Deno.env.get("TICKETMASTER_API_KEY") || "";
// Dashboard-pasted secrets often carry stray whitespace or wrapping quotes, which Ticketmaster rejects as Invalid ApiKey.
const ticketmasterApiKey = rawTicketmasterApiKey.trim().replace(/^["']|["']$/g, "");
const syncSecret = Deno.env.get("QCS_TICKETMASTER_SYNC_SECRET") || "";

function describeApiKey() {
  return {
    rawLength: rawTicketmasterApiKey.length,
    usedLength: ticketmasterApiKey.length,
    hadSurroundingWhitespace: rawTicketmasterApiKey !== rawTicketmasterApiKey.trim(),
    hadWrappingQuotes: /^["']|["']$/.test(rawTicketmasterApiKey.trim()),
    isAlphanumeric: /^[A-Za-z0-9]+$/.test(ticketmasterApiKey),
  };
}

// Centered on Cincinnati, radius covers Covington/Newport/NKY too.
const SEARCH_LATLONG = "39.1031,-84.5120";
const SEARCH_RADIUS_MILES = "25";
const CLASSIFICATIONS = ["Music", "Arts & Theatre", "Comedy", "Sports"];
// Sports/comedy/theatre were capped at 10, which dropped big local games (e.g. Bearcats football,
// FC Cincinnati playoffs) whenever ten higher-ranked listings existed.
const MAX_EVENTS_PER_CATEGORY = 40;
const NON_MUSIC_PAGES = 2;
// Ticketmaster lists parking passes and multi-show packages as separate "events".
const ADD_ON_LISTING = /\b(parking|package)\b/i;
const MUSIC_PAGES = 5;
const MAX_MUSIC_PER_CATEGORY = 30;
const MAX_MUSIC_PER_VENUE = 6;
const MAX_MUSIC_EVENTS = 80;
const DEFAULT_EVENT_TIME_ZONE = "America/New_York";

interface TicketmasterVenue {
  name: string;
  city?: { name?: string };
  state?: { stateCode?: string };
  address?: { line1?: string };
}

interface TicketmasterClassification {
  primary?: boolean;
  segment?: { name?: string };
  genre?: { name?: string };
  subGenre?: { name?: string };
}

interface TicketmasterImage {
  url?: string;
  ratio?: string;
  width?: number;
  height?: number;
  fallback?: boolean;
}

interface TicketmasterEvent {
  id?: string;
  name: string;
  url?: string;
  images?: TicketmasterImage[];
  info?: string;
  description?: string;
  pleaseNote?: string;
  dates?: {
    timezone?: string;
    start?: { dateTime?: string; localDate?: string; localTime?: string };
    access?: { startDateTime?: string };
    status?: { code?: string };
  };
  classifications?: TicketmasterClassification[];
  _embedded?: { venues?: TicketmasterVenue[] };
}

interface RankedTicketmasterEvent {
  event: TicketmasterEvent;
  category: string;
  relevanceRank: number;
}

interface ClockTime {
  hour: number;
  minute: number;
  label: string;
}

const SEGMENT_TO_CATEGORY: Record<string, string> = {
  music: "other", // refined further by genre below
  sports: "sports",
  arts_and_theatre: "community",
  film: "community",
};

const GENRE_TO_CATEGORY: Record<string, string> = {
  rock: "rock",
  pop: "pop",
  "hip-hop/rap": "hiphop",
  "hip hop": "hiphop",
  "r&b": "hiphop",
  latin: "latin",
  "latin music": "latin",
  reggae: "latin",
  "dance/electronic": "edm",
  electronic: "edm",
  country: "country",
  jazz: "jazz",
  comedy: "comedy",
  // Case study #13: genres that used to land in "other". Does not change show-time resolution.
  alternative: "alternative",
  "alternative rock": "alternative",
  indie: "alternative",
  "indie rock": "alternative",
  punk: "alternative",
  emo: "alternative",
  metal: "metal",
  "heavy metal": "metal",
  "hard rock": "rock",
  "classic rock": "rock",
  blues: "jazz",
  "blues & jazz": "jazz",
  soul: "rnb",
  funk: "rnb",
  "r&b/soul": "rnb",
  folk: "folk",
  "singer-songwriter": "folk",
  bluegrass: "folk",
  "world music": "folk",
  americana: "country",
  christian: "community",
  religious: "community",
  gospel: "community",
  classical: "community",
  "children's music": "community",
  theatre: "community",
  musical: "community",
  "magic & illusion": "community",
  spectacular: "community",
  "fairs & festivals": "festival",
  festival: "festival",
};

function parseClock(raw: string | undefined | null): ClockTime | null {
  if (!raw) return null;
  const match = String(raw).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])m?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const ampm = match[3].toLowerCase();
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 1 || hour > 12 || minute > 59) return null;
  if (hour === 12) hour = ampm === "a" ? 0 : 12;
  else if (ampm === "p") hour += 12;
  const label = `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${ampm === "a" ? "AM" : "PM"}`;
  return { hour, minute, label };
}

function formatClock(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function parseDoorsAndShow(text: string | undefined | null): { doors?: ClockTime; show?: ClockTime } {
  if (!text) return {};
  const normalized = text.replace(/\s+/g, " ");
  const alt = normalized.match(
    /(\d{1,2}(?::\d{2})?\s*[ap]m?)\s*doors\b(?:\s*\/\s*|\s*[·,;/-]\s*|\s+)(\d{1,2}(?::\d{2})?\s*[ap]m?)\s*show/i,
  );
  if (alt) {
    const doors = parseClock(alt[1]);
    const show = parseClock(alt[2]);
    if (doors || show) return { doors: doors ?? undefined, show: show ?? undefined };
  }
  const doorsMatch = normalized.match(/\bdoors(?:\s+open(?:s|ing)?)?\s*(?:at|:|-)?\s*(\d{1,2}(?::\d{2})?\s*[ap]m?)/i);
  const showMatch = normalized.match(/\bshow(?:\s+time|\s+starts?)?\s*(?:at|:|-)?\s*(\d{1,2}(?::\d{2})?\s*[ap]m?)/i);
  const doors = doorsMatch ? parseClock(doorsMatch[1]) : null;
  const show = showMatch ? parseClock(showMatch[1]) : null;
  return { doors: doors ?? undefined, show: show ?? undefined };
}

function localDateFromInstant(iso: string, timeZone: string): string | null {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

function zonedLocalToIso(localDate: string, hour: number, minute: number, timeZone: string): string | null {
  const match = String(localDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let offsetHours = 0; offsetHours <= 12; offsetHours += 1) {
    const utcMs = Date.UTC(year, month - 1, day, hour + offsetHours, minute, 0);
    const parts = formatter.formatToParts(new Date(utcMs));
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    if (get("year") === year && get("month") === month && get("day") === day && get("hour") === hour && get("minute") === minute) {
      return new Date(utcMs).toISOString();
    }
  }
  return null;
}

function addOneDay(localDate: string): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function clockAfter(left: ClockTime, right: ClockTime): boolean {
  return left.hour * 60 + left.minute >= right.hour * 60 + right.minute;
}

/**
 * Ticketmaster's start.dateTime is often doors time (especially Live Nation rooms
 * like Bogart's). Prefer an explicit SHOW time from pleaseNote/info, or start.dateTime
 * when dates.access is clearly the doors window. Times are interpreted in the event
 * timezone, defaulting to America/New_York so EST/EDT is handled automatically.
 */
function resolveEventSchedule(event: TicketmasterEvent): {
  eventDate: string | null;
  doorsLabel: string | null;
  showLabel: string | null;
  description: string | null;
  timeZone: string;
} {
  const timeZone = event.dates?.timezone || DEFAULT_EVENT_TIME_ZONE;
  const start = event.dates?.start ?? {};
  const accessStart = event.dates?.access?.startDateTime;
  const notes = [event.pleaseNote, event.info].filter(Boolean).join("\n");
  const parsed = parseDoorsAndShow(notes);
  let doors = parsed.doors ?? null;
  let show = parsed.show ?? null;

  const startMs = start.dateTime ? Date.parse(start.dateTime) : Number.NaN;
  const accessMs = accessStart ? Date.parse(accessStart) : Number.NaN;
  const gapMs = Number.isFinite(startMs) && Number.isFinite(accessMs) ? startMs - accessMs : Number.NaN;
  const accessLooksLikeDoors = Number.isFinite(gapMs) && gapMs >= 30 * 60 * 1000 && gapMs <= 3 * 60 * 60 * 1000;

  const clockFromInstant = (iso: string): ClockTime | null => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    return { hour, minute, label: formatClock(hour, minute) };
  };

  if (!doors && accessLooksLikeDoors && accessStart) doors = clockFromInstant(accessStart);
  if (!show && accessLooksLikeDoors && start.dateTime) show = clockFromInstant(start.dateTime);

  let localDate = start.localDate || (start.dateTime ? localDateFromInstant(start.dateTime, timeZone) : null);
  if (show && doors && !clockAfter(show, doors) && show.hour < 12 && doors.hour >= 12) {
    localDate = localDate ? addOneDay(localDate) : localDate;
  }

  let eventDate = start.dateTime && Number.isFinite(Date.parse(start.dateTime)) ? new Date(start.dateTime).toISOString() : null;
  if (show && localDate) {
    const iso = zonedLocalToIso(localDate, show.hour, show.minute, timeZone);
    if (iso) eventDate = iso;
  } else if (!eventDate && start.localDate && start.localTime) {
    const [hour, minute] = start.localTime.split(":").map(Number);
    if (Number.isInteger(hour) && Number.isInteger(minute)) {
      eventDate = zonedLocalToIso(start.localDate, hour, minute, timeZone);
    }
  }

  const showLabel = show?.label ?? null;
  const doorsLabel = doors?.label ?? null;
  const description = doorsLabel || showLabel
    ? [doorsLabel ? `Doors ${doorsLabel}` : null, showLabel ? `Show ${showLabel} ET` : null].filter(Boolean).join(" · ")
    : null;

  return { eventDate, doorsLabel, showLabel, description, timeZone };
}

/** Widest non-fallback 16:9 asset, which suits a wide card backdrop; falls back to the widest image. */
function pickHeroImage(images?: TicketmasterImage[]): string | null {
  const usable = (images ?? []).filter((image) => {
    if (!image.url || image.fallback) return false;
    try {
      return new URL(image.url).protocol === "https:";
    } catch {
      return false;
    }
  });
  if (usable.length === 0) return null;

  const byWidthDesc = [...usable].sort((left, right) => (right.width ?? 0) - (left.width ?? 0));
  const wide = byWidthDesc.find((image) => image.ratio === "16_9" && (image.width ?? 0) >= 1024);
  return (wide ?? byWidthDesc[0]).url ?? null;
}

function resolveCategory(classifications?: TicketmasterClassification[]): string {
  const ordered = [...(classifications ?? [])].sort((left, right) => Number(Boolean(right.primary)) - Number(Boolean(left.primary)));
  const primary = ordered[0];
  // Genre first, then sub-genre, across every classification (case study #13).
  for (const classification of ordered) {
    for (const name of [classification.genre?.name, classification.subGenre?.name]) {
      const key = name?.trim().toLowerCase();
      if (key && key !== "undefined" && GENRE_TO_CATEGORY[key]) return GENRE_TO_CATEGORY[key];
    }
  }

  const segmentKey = primary?.segment?.name
    ?.trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  if (segmentKey && SEGMENT_TO_CATEGORY[segmentKey]) {
    return SEGMENT_TO_CATEGORY[segmentKey];
  }

  return "other";
}

const DESCRIPTION_LIMIT = 600;

function cleanText(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Case study #13: a description when Ticketmaster has no doors/show line to store.
 * Ticketmaster's own text (description, then info) is used when present; otherwise a short
 * factual line from genre, venue and city. The handler prefers the v13 schedule line
 * ("Doors … · Show … ET") and any existing "rescheduled" note over this text.
 */
function buildDescription(event: TicketmasterEvent, category: string): string {
  const own = cleanText(event.description) || cleanText(event.info);
  if (own) return own.length > DESCRIPTION_LIMIT ? `${own.slice(0, DESCRIPTION_LIMIT - 1).trimEnd()}…` : own;

  const classification = [...(event.classifications ?? [])].sort(
    (left, right) => Number(Boolean(right.primary)) - Number(Boolean(left.primary)),
  )[0];
  const genre = [classification?.subGenre?.name, classification?.genre?.name]
    .map((name) => cleanText(name))
    .find((name) => name && name.toLowerCase() !== "undefined" && name.toLowerCase() !== "other");
  const venue = event._embedded?.venues?.[0];
  const place = [cleanText(venue?.name), cleanText(venue?.city?.name), cleanText(venue?.state?.stateCode)].filter(Boolean).join(", ");
  const kind = genre ? `${genre} ${category === "comedy" ? "show" : "event"}` : category === "sports" ? "game" : "live event";
  return `${cleanText(event.name)}: ${kind}${place ? ` at ${place}` : ""}. Official tickets through Ticketmaster.`;
}

async function fetchTicketmasterEvents(): Promise<{ events: RankedTicketmasterEvent[]; totalFetched: number }> {
  const eventsById = new Map<string, RankedTicketmasterEvent>();
  let totalFetched = 0;
  const startDateTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const venuesResponse = await fetch(`https://app.ticketmaster.com/discovery/v2/venues.json?${new URLSearchParams({
    apikey: ticketmasterApiKey,
    keyword: "Ludlow Garage",
    size: "20",
  })}`);
  if (!venuesResponse.ok) console.warn(`[ticketmaster-sync] Ludlow venue lookup returned ${venuesResponse.status}`);
  const venuesBody = venuesResponse.ok
    ? await venuesResponse.json() as { _embedded?: { venues?: (TicketmasterVenue & { id?: string })[] } }
    : null;
  const ludlowId = venuesBody?._embedded?.venues?.find((venue) =>
    /^(the )?ludlow garage$/i.test(venue.name) && venue.city?.name?.toLowerCase() === "cincinnati" && venue.state?.stateCode === "OH"
  )?.id;

  const searches = [...CLASSIFICATIONS.map((classification) => ({ classification, venueId: "" }))];
  if (ludlowId) searches.push({ classification: "Music", venueId: ludlowId });

  for (const { classification, venueId } of searches) {
    const pageLimit = venueId ? 2 : classification === "Music" ? MUSIC_PAGES : NON_MUSIC_PAGES;
    for (let page = 0; page < pageLimit; page++) {
      const params = new URLSearchParams({
        apikey: ticketmasterApiKey,
        latlong: SEARCH_LATLONG,
        radius: SEARCH_RADIUS_MILES,
        unit: "miles",
        classificationName: classification,
        size: "100",
        page: String(page),
        sort: classification === "Music" ? "date,asc" : "relevance,desc",
        startDateTime,
      });
      if (venueId) params.set("venueId", venueId);

      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
      if (!response.ok) {
        const faultBody = (await response.text()).slice(0, 500);
        throw new Error(
          `Ticketmaster ${classification} page ${page} request failed with status ${response.status}: ${faultBody} | keyMeta=${JSON.stringify(describeApiKey())}`,
        );
      }

      const body = (await response.json()) as { page?: { totalPages?: number }; _embedded?: { events?: TicketmasterEvent[] } };
      const resultEvents = body._embedded?.events ?? [];
      totalFetched += resultEvents.length;

      resultEvents.forEach((event, index) => {
        const key = event.id ?? `${event.name}:${event.dates?.start?.dateTime ?? "unknown-date"}`;
        const candidate = {
          event,
          category: resolveCategory(event.classifications),
          relevanceRank: page * 100 + index + 1,
        };
        const existing = eventsById.get(key);
        if (!existing || candidate.relevanceRank < existing.relevanceRank) {
          eventsById.set(key, candidate);
        }
      });

      if (page + 1 >= (body.page?.totalPages ?? 1) || resultEvents.length === 0) break;
    }
  }

  return { events: Array.from(eventsById.values()), totalFetched };
}

function eventInstant(event: TicketmasterEvent): number {
  const resolved = resolveEventSchedule(event).eventDate ?? event.dates?.start?.dateTime;
  return resolved ? Date.parse(resolved) : Number.NaN;
}

function selectEligibleEvents(events: RankedTicketmasterEvent[], now: number) {
  const skipped = { notOnSale: 0, notFuture: 0, noHttpsTicketUrl: 0, noVenue: 0, duplicateShow: 0, overVenueLimit: 0, overCategoryLimit: 0, overMusicLimit: 0, addOnListing: 0, sameVenueAndTime: 0 };
  const eligible: RankedTicketmasterEvent[] = [];

  for (const candidate of events) {
    const { event } = candidate;
    if (event.dates?.status?.code !== "onsale") {
      skipped.notOnSale += 1;
      continue;
    }

    const eventTime = eventInstant(event);
    if (!Number.isFinite(eventTime) || eventTime <= now) {
      skipped.notFuture += 1;
      continue;
    }

    let hasHttpsTicketUrl = false;
    try {
      hasHttpsTicketUrl = new URL(event.url ?? "").protocol === "https:";
    } catch {
      hasHttpsTicketUrl = false;
    }
    if (!hasHttpsTicketUrl) {
      skipped.noHttpsTicketUrl += 1;
      continue;
    }
    if (!event._embedded?.venues?.[0]?.name) {
      skipped.noVenue += 1;
      continue;
    }
    if (ADD_ON_LISTING.test(event.name)) {
      skipped.addOnListing += 1;
      continue;
    }

    eligible.push(candidate);
  }

  eligible.sort((left, right) =>
    eventInstant(left.event) - eventInstant(right.event) ||
    left.relevanceRank - right.relevanceRank
  );
  const categoryCounts = new Map<string, number>();
  const venueCounts = new Map<string, number>();
  const seenShows = new Set<string>();
  const seenSlots = new Set<string>();
  const selected: RankedTicketmasterEvent[] = [];
  let musicCount = 0;

  for (const candidate of eligible) {
    const isMusic = candidate.event.classifications?.[0]?.segment?.name?.toLowerCase() === "music";
    const venueName = candidate.event._embedded?.venues?.[0]?.name?.trim().toLowerCase().replace(/^the /, "");
    const showKey = venueName ? `${venueName}:${candidate.event.name.trim().toLowerCase()}` : null;
    if (showKey && seenShows.has(showKey)) {
      skipped.duplicateShow += 1;
      continue;
    }
    // Venues sometimes publish two listings (or a renamed copy) for one show; keep the best-ranked one.
    const slotKey = venueName ? `${venueName}:${eventInstant(candidate.event)}` : null;
    if (slotKey && seenSlots.has(slotKey)) {
      skipped.sameVenueAndTime += 1;
      continue;
    }

    const count = categoryCounts.get(candidate.category) ?? 0;
    if (count >= (isMusic ? MAX_MUSIC_PER_CATEGORY : MAX_EVENTS_PER_CATEGORY)) {
      skipped.overCategoryLimit += 1;
      continue;
    }
    if (isMusic && venueName && (venueCounts.get(venueName) ?? 0) >= MAX_MUSIC_PER_VENUE) {
      skipped.overVenueLimit += 1;
      continue;
    }
    if (isMusic && musicCount >= MAX_MUSIC_EVENTS) {
      skipped.overMusicLimit += 1;
      continue;
    }
    categoryCounts.set(candidate.category, count + 1);
    if (isMusic) musicCount += 1;
    if (isMusic && venueName) venueCounts.set(venueName, (venueCounts.get(venueName) ?? 0) + 1);
    if (showKey) seenShows.add(showKey);
    if (slotKey) seenSlots.add(slotKey);
    selected.push(candidate);
  }

  return { events: selected, skipped, categoryCounts: Object.fromEntries(categoryCounts) };
}

async function upsertVenue(
  supabase: ReturnType<typeof createClient>,
  venue: TicketmasterVenue | undefined,
): Promise<string | null> {
  if (!venue?.name) return null;

  const name = /^the ludlow garage$/i.test(venue.name) ? "Ludlow Garage" : venue.name;
  const { data: existing } = await supabase.from("venues").select("id").eq("name", name).maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await supabase
    .from("venues")
    .insert({
      name,
      address: venue.address?.line1 ?? null,
      city: venue.city?.name ?? null,
      state: venue.state?.stateCode ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ticketmaster-sync] venue insert failed", error);
    return null;
  }

  return inserted?.id as string;
}

/** Last path segment of a ticket URL, i.e. the Ticketmaster/TicketWeb event id (stable across renames). */
function ticketEventId(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname.split("/").filter(Boolean).at(-1) ?? null;
  } catch {
    return null;
  }
}

function chooseScheduleDescription(generated: string | null, existing: string | null | undefined): string | undefined {
  if (existing && /rescheduled/i.test(existing)) return existing;
  return generated ?? undefined;
}

/**
 * v13 writes a doors/show line, and keeps an existing note that says the show was rescheduled.
 * It does not replace some other description already on the row. When neither applies (a new
 * row, or a blank one), case study #13 still stores a description.
 */
function resolveStoredDescription(
  scheduleDescription: string | null,
  existingDescription: string | null | undefined,
  fallback: string,
): string | undefined {
  const chosen = chooseScheduleDescription(scheduleDescription, existingDescription);
  if (chosen) return chosen;
  if (existingDescription) return undefined;
  return fallback;
}

/**
 * Events are upserted on (title, event_date), so a listing that Ticketmaster renames, moves
 * from doors time to show time, or reschedules used to create a second row. Reuse the synced
 * row for the same ticket event id first, then the same venue and start time.
 */
async function findExistingSyncedEvent(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  event: TicketmasterEvent,
  venueId: string,
  eventDate?: string | null,
): Promise<{ id: string; description: string | null } | null> {
  const ticketId = ticketEventId(event.url);
  if (ticketId) {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, ticket_url, venue_id, description")
      .eq("source", "sync")
      .ilike("ticket_url", `%${ticketId}%`);
    if (!error && data?.length) {
      const rows = data as { id: string; title: string; ticket_url: string | null; venue_id: string | null; description: string | null }[];
      const exact = rows.filter((row) => ticketEventId(row.ticket_url) === ticketId);
      const match = exact.find((row) => row.venue_id === venueId) ?? exact[0];
      if (match) return { id: match.id, description: match.description };
    }
  }

  if (!eventDate) return null;
  const { data, error } = await supabase
    .from("events")
    .select("id, title, ticket_url, description")
    .eq("source", "sync")
    .eq("venue_id", venueId)
    .eq("event_date", eventDate);
  if (error || !data?.length) return null;

  const rows = data as { id: string; title: string; ticket_url: string | null; description: string | null }[];
  const match =
    rows.find((existing) => existing.title === event.name) ??
    rows.find((existing) => ticketId && ticketEventId(existing.ticket_url) === ticketId) ??
    rows[0];
  return match ? { id: match.id, description: match.description } : null;
}

/**
 * Sync trending Cincinnati/NKY events from the Ticketmaster Discovery API.
 * Requires TICKETMASTER_API_KEY (free tier: https://developer.ticketmaster.com/).
 * Runs on demand or via scheduled invocation, upserts into the events table.
 */
async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  if (!syncSecret || req.headers.get("x-qcs-sync-secret") !== syncSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  if (!ticketmasterApiKey) {
    return new Response(JSON.stringify({ error: "not_configured", message: "TICKETMASTER_API_KEY is not set" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { events: fetchedEvents, totalFetched } = await fetchTicketmasterEvents();
    const { events, skipped, categoryCounts } = selectEligibleEvents(fetchedEvents, Date.now());
    const dryRun = new URL(req.url).searchParams.get("dry_run") === "true";

    if (dryRun) {
      return new Response(
        JSON.stringify({
          message: "sync_preview",
          totalFetched,
          deduplicated: fetchedEvents.length,
          eligible: events.length,
          skipped,
          categoryCounts,
          maxPerCategory: MAX_EVENTS_PER_CATEGORY,
          maxMusicPerCategory: MAX_MUSIC_PER_CATEGORY,
          maxMusicPerVenue: MAX_MUSIC_PER_VENUE,
          maxMusicEvents: MAX_MUSIC_EVENTS,
          samples: events.slice(0, 12).map(({ event, category, relevanceRank }) => {
            const schedule = resolveEventSchedule(event);
            return {
              title: event.name,
              venue: event._embedded?.venues?.[0]?.name ?? null,
              category,
              relevanceRank,
              ticketmasterDateTime: event.dates?.start?.dateTime,
              eventDate: schedule.eventDate,
              schedule: schedule.description,
            };
          }),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (events.length === 0) {
      return new Response(JSON.stringify({ message: "no_eligible_events", totalFetched, synced: 0, skipped }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    let synced = 0;
    let failed = 0;
    const venueIds = new Map<string, string | null>();

    for (const { event, category, relevanceRank } of events) {
      const schedule = resolveEventSchedule(event);
      const eventDate = schedule.eventDate;
      const venue = event._embedded?.venues?.[0];
      const venueKey = `${venue?.name.trim().toLowerCase().replace(/^the /, "")}:${venue?.city?.name}:${venue?.state?.stateCode}`;
      if (!venueIds.has(venueKey)) venueIds.set(venueKey, await upsertVenue(supabase, venue));
      const venueId = venueIds.get(venueKey) ?? null;
      if (!venueId || !eventDate) {
        failed += 1;
        continue;
      }

      const existing = await findExistingSyncedEvent(supabase, event, venueId, eventDate);
      const description = resolveStoredDescription(
        schedule.description,
        existing?.description,
        buildDescription(event, category),
      );
      const row: Record<string, unknown> = {
          title: event.name,
          artist_name: event.name,
          event_date: eventDate,
          venue_id: venueId,
          status: "published",
          ticket_url: event.url ?? null,
          category,
          source: "sync",
          hero_image_url: pickHeroImage(event.images),
          ticketmaster_relevance_rank: event.classifications?.[0]?.segment?.name?.toLowerCase() === "music" ? null : relevanceRank,
      };
      if (description) row.description = description;
      const { error } = existing
        ? await supabase.from("events").update(row).eq("id", existing.id)
        : await supabase.from("events").upsert(row, { onConflict: "title,event_date" });

      if (error) {
        console.error("[ticketmaster-sync] event upsert failed", error);
        failed += 1;
      } else {
        synced += 1;
      }
    }

    console.log(`[ticketmaster-sync] synced ${synced}/${events.length} eligible events (${failed} failed)`);

    return new Response(
      JSON.stringify({ message: "sync_completed", synced, failed, totalFetched, eligible: events.length, skipped, categoryCounts }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch (error) {
    console.error("[ticketmaster-sync] unexpected error", error);
    return new Response(
      JSON.stringify({ error: "internal_server_error", message: error instanceof Error ? error.message : "unknown" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}

export default { fetch: handler };
