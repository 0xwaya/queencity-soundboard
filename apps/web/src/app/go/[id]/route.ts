import { after, type NextRequest, NextResponse } from "next/server";
import { buildAffiliateUrl, cleanSubId } from "@/lib/affiliate";
import { DEFAULT_SOURCE, SOURCE_COOKIE } from "@/lib/click-source";
import { getPublishedEventById, isEventId } from "@/lib/data";
import { looksLikeBot, referrerHost } from "@/lib/go";
import { getServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function redirect(request: NextRequest, location: string, status = 302) {
  const target = location.startsWith("/") ? new URL(location, request.nextUrl.origin) : new URL(location);
  return NextResponse.redirect(target, { status, headers: NO_STORE_HEADERS });
}

/**
 * Case study #9: log the click first-party, then send the visitor to the affiliate link.
 * subId1 = event id, subId2 = placement (?p=), subId3 = source (?src=, else the qcs_src cookie, else "organic").
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isEventId(id)) return redirect(request, "/events");

  const { data: event } = await getPublishedEventById(id);
  if (!event) return redirect(request, "/events");

  const search = request.nextUrl.searchParams;
  const placement = cleanSubId(search.get("p")) || "unknown";
  const source = cleanSubId(search.get("src") ?? request.cookies.get(SOURCE_COOKIE)?.value) || DEFAULT_SOURCE;

  const destination = buildAffiliateUrl(event.ticket_url, { subId1: event.id, subId2: placement, subId3: source });
  if (!destination) return redirect(request, `/events/${event.id}`);

  const userAgent = request.headers.get("user-agent");
  const referer = referrerHost(request.headers.get("referer"));
  const isBot = looksLikeBot(userAgent);

  if (hasServerSupabaseConfig()) {
    // Logging must never delay or block the redirect.
    after(async () => {
      try {
        const { error } = await getServerSupabaseClient().rpc("log_outbound_click", {
          p_event_id: event.id,
          p_placement: placement,
          p_src: source,
          p_referrer_host: referer,
          p_is_bot: isBot,
        });
        if (error) console.error("[go] click log failed", error.message);
      } catch (err) {
        console.error("[go] click log threw", err);
      }
    });
  }

  return redirect(request, destination);
}
