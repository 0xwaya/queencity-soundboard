import { getSupabaseBrowserClient, type EventItem } from "@/lib/supabase";

export async function getPublishedEvents(): Promise<EventItem[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("events")
      .select("id,title,artist_name,description,hero_image_url,event_date,status,venue_id")
      .eq("status", "published")
      .order("event_date", { ascending: true });

    if (error) throw error;
    return (data as EventItem[]) ?? [];
  } catch {
    return [];
  }
}
