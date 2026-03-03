import { getSupabaseBrowserClient, type EventItem, type MerchItem } from "@/lib/supabase";

export async function getPublishedEvents(): Promise<EventItem[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        "id,title,artist_name,description,hero_image_url,event_date,status,venue_id,ticket_url,eventbrite_event_id,venues(id,name,city,state)",
      )
      .eq("status", "published")
      .order("event_date", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as Array<EventItem & { venues?: EventItem["venues"] | EventItem["venues"][] }>;
    return rows.map((row) => ({
      ...row,
      venues: Array.isArray(row.venues) ? row.venues[0] ?? null : row.venues ?? null,
    }));
  } catch {
    return [];
  }
}

export async function getActiveMerch(): Promise<MerchItem[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("merch")
      .select("id,name,description,price_cents,inventory_count,image_url,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as MerchItem[]) ?? [];
  } catch {
    return [];
  }
}
