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
const MAX_EVENTS_PER_CATEGORY = 10;

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
  id?: string;
  name: string;
  url?: string;
  dates?: { start?: { dateTime?: string }; status?: { code?: string } };
  classifications?: TicketmasterClassification[];
  _embedded?: { venues?: TicketmasterVenue[] };
}

interface RankedTicketmasterEvent {
  event: TicketmasterEvent;
  category: string;
  relevanceRank: number;
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

async function fetchTicketmasterEvents(): Promise<{ events: RankedTicketmasterEvent[]; totalFetched: number }> {
  const eventsById = new Map<string, RankedTicketmasterEvent>();
  let totalFetched = 0;

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
      const faultBody = (await response.text()).slice(0, 500);
      throw new Error(
        `Ticketmaster ${classification} request failed with status ${response.status}: ${faultBody} | keyMeta=${JSON.stringify(describeApiKey())}`,
      );
    }

    const body = (await response.json()) as { _embedded?: { events?: TicketmasterEvent[] } };
    const resultEvents = body._embedded?.events ?? [];
    totalFetched += resultEvents.length;

    resultEvents.forEach((event, index) => {
      const key = event.id ?? `${event.name}:${event.dates?.start?.dateTime ?? "unknown-date"}`;
      const candidate = {
        event,
        category: resolveCategory(event.classifications),
        relevanceRank: index + 1,
      };
      const existing = eventsById.get(key);
      if (!existing || candidate.relevanceRank < existing.relevanceRank) {
        eventsById.set(key, candidate);
      }
    });
  }

  return { events: Array.from(eventsById.values()), totalFetched };
}

function selectEligibleEvents(events: RankedTicketmasterEvent[], now: number) {
  const skipped = { notOnSale: 0, notFuture: 0, noHttpsTicketUrl: 0, overCategoryLimit: 0 };
  const eligible: RankedTicketmasterEvent[] = [];

  for (const candidate of events) {
    const { event } = candidate;
    if (event.dates?.status?.code !== "onsale") {
      skipped.notOnSale += 1;
      continue;
    }

    const eventTime = event.dates.start?.dateTime ? Date.parse(event.dates.start.dateTime) : Number.NaN;
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

    eligible.push(candidate);
  }

  eligible.sort((left, right) => left.category.localeCompare(right.category) || left.relevanceRank - right.relevanceRank);
  const categoryCounts = new Map<string, number>();
  const selected: RankedTicketmasterEvent[] = [];

  for (const candidate of eligible) {
    const count = categoryCounts.get(candidate.category) ?? 0;
    if (count >= MAX_EVENTS_PER_CATEGORY) {
      skipped.overCategoryLimit += 1;
      continue;
    }
    categoryCounts.set(candidate.category, count + 1);
    selected.push(candidate);
  }

  return { events: selected, skipped, categoryCounts: Object.fromEntries(categoryCounts) };
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
          samples: events.slice(0, 12).map(({ event, category, relevanceRank }) => ({
            title: event.name,
            venue: event._embedded?.venues?.[0]?.name ?? null,
            category,
            relevanceRank,
            eventDate: event.dates?.start?.dateTime,
          })),
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

    for (const { event, category, relevanceRank } of events) {
      const eventDate = event.dates?.start?.dateTime;
      const venueId = await upsertVenue(supabase, event._embedded?.venues?.[0]);

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
          ticketmaster_relevance_rank: relevanceRank,
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
