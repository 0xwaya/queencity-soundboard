import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ticketmasterApiKey = Deno.env.get("TICKETMASTER_API_KEY") || "";

// Centered on Cincinnati, radius covers Covington/Newport/NKY too.
const SEARCH_LATLONG = "39.1031,-84.5120";
const SEARCH_RADIUS_MILES = "25";
const CLASSIFICATIONS = ["Music", "Arts & Theatre", "Comedy", "Sports"];

interface TicketmasterVenue {
  name: string;
  city?: { name?: string };
  state?: { stateCode?: string };
  address?: { line1?: string };
}

interface TicketmasterClassification {
  segment?: { name?: string };
  genre?: { name?: string };
}

interface TicketmasterEvent {
  name: string;
  url?: string;
  dates?: { start?: { dateTime?: string } };
  classifications?: TicketmasterClassification[];
  _embedded?: { venues?: TicketmasterVenue[] };
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
};

function resolveCategory(classifications?: TicketmasterClassification[]): string {
  const primary = classifications?.[0];
  const genreKey = primary?.genre?.name?.trim().toLowerCase();
  if (genreKey && GENRE_TO_CATEGORY[genreKey]) {
    return GENRE_TO_CATEGORY[genreKey];
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

async function fetchTicketmasterEvents(): Promise<TicketmasterEvent[]> {
  const events: TicketmasterEvent[] = [];

  for (const classification of CLASSIFICATIONS) {
    const params = new URLSearchParams({
      apikey: ticketmasterApiKey,
      latlong: SEARCH_LATLONG,
      radius: SEARCH_RADIUS_MILES,
      unit: "miles",
      classificationName: classification,
      size: "100",
      sort: "relevance,desc",
    });

    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!response.ok) {
      console.error(`[ticketmaster-sync] fetch failed for ${classification}: ${response.status}`);
      continue;
    }

    const body = (await response.json()) as { _embedded?: { events?: TicketmasterEvent[] } };
    events.push(...(body._embedded?.events ?? []));
  }

  return events;
}

async function upsertVenue(
  supabase: ReturnType<typeof createClient>,
  venue: TicketmasterVenue | undefined,
): Promise<string | null> {
  if (!venue?.name) return null;

  const { data: existing } = await supabase.from("venues").select("id").eq("name", venue.name).maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await supabase
    .from("venues")
    .insert({
      name: venue.name,
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

/**
 * Sync trending Cincinnati/NKY events from the Ticketmaster Discovery API.
 * Requires TICKETMASTER_API_KEY (free tier: https://developer.ticketmaster.com/).
 * Runs on demand or via scheduled invocation, upserts into the events table.
 */
export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
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
    const events = await fetchTicketmasterEvents();

    if (events.length === 0) {
      return new Response(JSON.stringify({ message: "no_events_found", synced: 0 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    let synced = 0;
    let failed = 0;

    for (const event of events) {
      const eventDate = event.dates?.start?.dateTime;
      if (!eventDate) {
        failed += 1;
        continue;
      }

      const venueId = await upsertVenue(supabase, event._embedded?.venues?.[0]);
      const category = resolveCategory(event.classifications);

      const { error } = await supabase.from("events").upsert(
        {
          title: event.name,
          artist_name: event.name,
          event_date: eventDate,
          venue_id: venueId,
          status: "published",
          ticket_url: event.url ?? null,
          category,
          source: "sync",
        },
        { onConflict: "title,event_date" },
      );

      if (error) {
        console.error("[ticketmaster-sync] event upsert failed", error);
        failed += 1;
      } else {
        synced += 1;
      }
    }

    console.log(`[ticketmaster-sync] synced ${synced}/${events.length} events (${failed} failed)`);

    return new Response(
      JSON.stringify({ message: "sync_completed", synced, failed, total: events.length }),
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
