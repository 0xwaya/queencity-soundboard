import { cache } from "react";
import { getSupabaseBrowserClient, hasSupabaseConfig, type EventItem, type MerchItem } from "@/lib/supabase";
import { normalizeHttpsUrl, normalizeImageUrl } from "@/lib/url";

export type QueryResult<T> = {
  data: T;
  error: string | null;
};

const EVENT_TIME_ZONE = "America/New_York";

function eventDayKey(value: Date | number | string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function startOfEventDay(now: Date): Date {
  const [year, month, day] = eventDayKey(now).split("-").map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const localParts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMidnight));
  const part = (type: string) => Number(localParts.find((item) => item.type === type)?.value ?? 0);
  const localClockAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return new Date(utcMidnight + utcMidnight - localClockAsUtc);
}

export function isPublicUpcomingEvent(event: EventItem, now = Date.now()): boolean {
  const eventTime = new Date(event.event_date).getTime();
  return (
    Number.isFinite(eventTime) &&
    (eventTime >= now || eventDayKey(eventTime) === eventDayKey(now)) &&
    event.venues?.is_active !== false &&
    event.venues?.name !== "Madison Theater"
  );
}

/** A promotion that has passed its paid window must not keep its placement. */
export function isPromotionActive(event: EventItem, now = Date.now()): boolean {
  if (!event.is_promoted) return false;
  if (!event.promoted_until) return true;
  return new Date(event.promoted_until).getTime() > now;
}

export function getHomepageEvents(events: EventItem[], limit = 3, now = Date.now()): EventItem[] {
  const today = eventDayKey(now);
  return [...events]
    .sort((a, b) => {
      const aTime = new Date(a.event_date).getTime();
      const bTime = new Date(b.event_date).getTime();
      const aToday = eventDayKey(aTime) === today;
      const bToday = eventDayKey(bTime) === today;
      if (aToday !== bToday) return aToday ? -1 : 1;

      if (aToday && bToday) {
        const aUpcoming = aTime >= now;
        const bUpcoming = bTime >= now;
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      }

      return aTime - bTime;
    })
    .slice(0, limit);
}

export function dedupeSyncedShows(events: EventItem[]): EventItem[] {
  const seen = new Set<string>();
  return [...events].sort((left, right) => Date.parse(left.event_date) - Date.parse(right.event_date)).filter((event) => {
    if (event.source !== "sync" || !event.venue_id) return true;
    const venue = event.venues
      ? `${event.venues.name.trim().toLowerCase().replace(/^the /, "")}:${event.venues.city}:${event.venues.state}`
      : event.venue_id;
    const key = `${venue}:${event.title.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadPublishedEvents(): Promise<QueryResult<EventItem[]>> {
  if (!hasSupabaseConfig()) {
    return { data: [], error: null };
  }

  try {
    const now = new Date();
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,artist_name,description,hero_image_url,event_date,status,venue_id,ticket_url,category,is_promoted,promoted_until,ticketmaster_relevance_rank,source,venues(id,name,city,state,is_active)",
      )
      .eq("status", "published")
      .gte("event_date", startOfEventDay(now).toISOString())
      .order("event_date", { ascending: true })
      .order("is_promoted", { ascending: false })
      .order("ticketmaster_relevance_rank", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[getPublishedEvents] Supabase query failed", error);
      return { data: [], error: "Unable to load events right now." };
    }

    const rows = (data ?? []) as Array<EventItem & { venues?: EventItem["venues"] | EventItem["venues"][] }>;
    const normalizedRows = rows.map((row) => ({
      ...row,
      ticket_url: normalizeHttpsUrl(row.ticket_url),
      hero_image_url: normalizeImageUrl(row.hero_image_url),
      is_promoted: isPromotionActive(row),
      venues: Array.isArray(row.venues) ? row.venues[0] ?? null : row.venues ?? null,
    }));
    return { data: dedupeSyncedShows(normalizedRows.filter((row) => isPublicUpcomingEvent(row, now.getTime()))), error: null };
  } catch (err) {
    console.error("[getPublishedEvents] Unexpected failure", err);
    return { data: [], error: "Unable to load events right now." };
  }
}

/** One Supabase read per request, shared by metadata, the page body and related-event blocks. */
export const getPublishedEvents = cache(loadPublishedEvents);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isEventId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** An upcoming published event by id, or null (unknown id, past, archived or hidden venue). */
export async function getPublishedEventById(id: string): Promise<QueryResult<EventItem | null>> {
  if (!isEventId(id)) return { data: null, error: null };
  const result = await getPublishedEvents();
  return { data: result.data.find((event) => event.id === id) ?? null, error: result.error };
}

/** Up to `limit` other events in the next `days` days, same category or venue first. */
export function getSimilarEvents(target: EventItem, events: EventItem[], limit = 3, days = 14, now = Date.now()): EventItem[] {
  const horizon = now + days * 24 * 60 * 60 * 1000;
  const score = (event: EventItem) =>
    (target.category && event.category === target.category ? 2 : 0) + (target.venue_id && event.venue_id === target.venue_id ? 1 : 0);
  return events
    .filter((event) => {
      if (event.id === target.id) return false;
      const time = Date.parse(event.event_date);
      return time >= now && time <= horizon && score(event) > 0;
    })
    .sort((a, b) => score(b) - score(a) || Date.parse(a.event_date) - Date.parse(b.event_date))
    .slice(0, limit);
}

/** Distinct categories present among published events, for filter pills. */
export function getEventCategories(events: EventItem[]): string[] {
  const categories = new Set(events.map((event) => event.category).filter((c): c is string => Boolean(c)));
  return Array.from(categories).sort();
}

export async function getActiveMerch(): Promise<QueryResult<MerchItem[]>> {
  if (!hasSupabaseConfig()) {
    return { data: [], error: null };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("merch")
      .select("id,name,description,price_cents,inventory_count,image_url,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getActiveMerch] Supabase query failed", error);
      return { data: [], error: "Unable to load merch right now." };
    }
    return { data: (data as MerchItem[]) ?? [], error: null };
  } catch (err) {
    console.error("[getActiveMerch] Unexpected failure", err);
    return { data: [], error: "Unable to load merch right now." };
  }
}

/**
 * Shows for the /tonight landing page (case study #10): everything on today's Eastern date
 * that has not ended, promoted first then by start time. When today has nothing left, the
 * next date with shows is used so the TikTok bio link never lands on an empty page.
 */
export function getTonightEvents(events: EventItem[], now = Date.now()): { day: string; isToday: boolean; events: EventItem[] } {
  const today = eventDayKey(now);
  const byDay = new Map<string, EventItem[]>();
  for (const event of events) {
    const time = Date.parse(event.event_date);
    if (!Number.isFinite(time)) continue;
    const day = eventDayKey(time);
    if (day < today) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), event]);
  }
  const days = Array.from(byDay.keys()).sort();
  const day = byDay.has(today) ? today : days[0] ?? today;
  const list = [...(byDay.get(day) ?? [])].sort(
    (a, b) => Number(Boolean(b.is_promoted)) - Number(Boolean(a.is_promoted)) || Date.parse(a.event_date) - Date.parse(b.event_date),
  );
  return { day, isToday: day === today, events: list };
}
