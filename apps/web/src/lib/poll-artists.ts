import { getServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase-server";

// Fallback list used when Supabase isn't configured or the poll_artists table is empty.
export const POLL_ARTISTS = [
  "Ilegales",
  "Tyler Childers",
  "The National",
  "The Black Keys",
  "21 Savage",
] as const;

export type PollArtist = (typeof POLL_ARTISTS)[number];

export function isPollArtist(value: string): value is PollArtist {
  return POLL_ARTISTS.includes(value as PollArtist);
}

/** Active poll artists from the DB, falling back to the static list. */
export async function getActivePollArtists(): Promise<string[]> {
  if (!hasServerSupabaseConfig()) {
    return [...POLL_ARTISTS];
  }

  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from("poll_artists")
      .select("name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return [...POLL_ARTISTS];
    }

    return data.map((row) => row.name as string);
  } catch (error) {
    console.error("[poll-artists] Failed to load active poll artists", error);
    return [...POLL_ARTISTS];
  }
}

