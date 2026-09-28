import { getSupabaseBrowserClient, hasSupabaseConfig, type EventItem, type MerchItem } from "@/lib/supabase";
import { normalizeHttpsUrl } from "@/lib/url";

export type QueryResult<T> = {
  data: T;
  error: string | null;
};

export function isPublicUpcomingEvent(event: EventItem, now = Date.now()): boolean {
  const eventTime = new Date(event.event_date).getTime();
  return (
    eventTime >= now &&
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

export async function getPublishedEvents(): Promise<QueryResult<EventItem[]>> {
  if (!hasSupabaseConfig()) {
    return { data: [], error: null };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,artist_name,description,hero_image_url,event_date,status,venue_id,ticket_url,category,is_promoted,promoted_until,ticketmaster_relevance_rank,venues(id,name,city,state,is_active)",
      )
      .eq("status", "published")
      .gte("event_date", new Date().toISOString())
      .order("is_promoted", { ascending: false })
      .order("ticketmaster_relevance_rank", { ascending: true, nullsFirst: false })
      .order("event_date", { ascending: true });

    if (error) {
      console.error("[getPublishedEvents] Supabase query failed", error);
      return { data: [], error: "Unable to load events right now." };
    }

    const rows = (data ?? []) as Array<EventItem & { venues?: EventItem["venues"] | EventItem["venues"][] }>;
    const normalizedRows = rows.map((row) => ({
      ...row,
      ticket_url: normalizeHttpsUrl(row.ticket_url),
      is_promoted: isPromotionActive(row),
      venues: Array.isArray(row.venues) ? row.venues[0] ?? null : row.venues ?? null,
    }));
    return { data: normalizedRows.filter((row) => isPublicUpcomingEvent(row)), error: null };
  } catch (err) {
    console.error("[getPublishedEvents] Unexpected failure", err);
    return { data: [], error: "Unable to load events right now." };
  }
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
