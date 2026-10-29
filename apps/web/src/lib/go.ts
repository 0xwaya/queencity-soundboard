import { buildAffiliateUrl, cleanSubId } from "@/lib/affiliate";

/**
 * First-party outbound link for a Buy button: /go/<eventId>?p=<placement>.
 *
 * The /go route logs the click (public.outbound_clicks) and then redirects to the
 * affiliate URL with subId1 = event id, subId2 = placement, subId3 = traffic source.
 * Returns null when the event has no affiliate-tracked ticket link, so a button never
 * points at a dead redirect.
 */
export function goHref(eventId: string | null | undefined, ticketUrl: string | null | undefined, placement: string): string | null {
  if (!eventId || !buildAffiliateUrl(ticketUrl, { subId1: eventId })) return null;
  const p = cleanSubId(placement);
  return `/go/${encodeURIComponent(eventId)}${p ? `?p=${encodeURIComponent(p)}` : ""}`;
}

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python-requests|httpclient/i;

export function looksLikeBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.toLowerCase().slice(0, 255) || null;
  } catch {
    return null;
  }
}
