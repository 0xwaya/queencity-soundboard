/**
 * Multi-program affiliate link builder.
 *
 * Each network (Impact, CJ, Partnerize, ...) issues its own tracking-link format, so the
 * template is supplied per provider via env rather than hardcoded. A template may contain:
 *   {url}         destination, URL-encoded (use for networks that take a deep-link param)
 *   {rawUrl}      destination, not encoded
 *   {publisherId} value of NEXT_PUBLIC_IMPACT_PUBLISHER_ID
 *   {subId}       per-click attribution value, URL-encoded
 *
 * Approved event-specific links and Sovrn links are already tracked and pass through.
 * Other destinations require a valid provider tracking template. This
 * prevents ticket CTAs from silently becoming untracked links.
 */
import { normalizeHttpsUrl } from "@/lib/url";

const EVENT_AFFILIATE_LINKS = new Map([
  [
    "https://www.ticketweb.com/event/the-big-whisker-revival-xii-the-southgate-house-revival-tickets/14672083",
    "https://sovrn.co/oak6tu9",
  ],
]);

export type AffiliateProvider = "ticketmaster" | "ticketweb" | "seatgeek" | "stubhub" | "vividseats" | "axs" | "eventbrite" | "sovrn";

const PROVIDER_HOSTS: Record<AffiliateProvider, readonly string[]> = {
  ticketmaster: ["ticketmaster.com", "livenation.com", "frontgatetickets.com"],
  ticketweb: ["ticketweb.com"],
  seatgeek: ["seatgeek.com"],
  stubhub: ["stubhub.com"],
  vividseats: ["vividseats.com"],
  axs: ["axs.com"],
  eventbrite: ["eventbrite.com"],
  sovrn: ["sovrn.co"],
};

const PROVIDER_TEMPLATE_ENV: Record<AffiliateProvider, string | undefined> = {
  ticketmaster: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER,
  ticketweb: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETWEB,
  seatgeek: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_SEATGEEK,
  stubhub: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_STUBHUB,
  vividseats: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_VIVIDSEATS,
  axs: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_AXS,
  eventbrite: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_EVENTBRITE,
  sovrn: undefined,
};

/** Matches the host itself or any subdomain of it, never a lookalike such as "notticketmaster.com". */
function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}

export function resolveAffiliateProvider(url: string): AffiliateProvider | null {
  const normalized = normalizeHttpsUrl(url);
  if (!normalized) return null;

  const { hostname } = new URL(normalized);
  for (const [provider, domains] of Object.entries(PROVIDER_HOSTS) as [AffiliateProvider, readonly string[]][]) {
    if (domains.some((domain) => hostMatches(hostname, domain))) return provider;
  }
  return null;
}

export function hasAffiliateProgram(url: string): boolean {
  const destination = normalizeHttpsUrl(url);
  if (destination && EVENT_AFFILIATE_LINKS.has(destination)) return true;
  const provider = resolveAffiliateProvider(url);
  return provider === "sovrn" || Boolean(provider && PROVIDER_TEMPLATE_ENV[provider]);
}

export function buildAffiliateUrl(rawUrl?: string | null, subId?: string): string | null {
  const destination = normalizeHttpsUrl(rawUrl);
  if (!destination) return null;

  const eventAffiliateLink = EVENT_AFFILIATE_LINKS.get(destination);
  if (eventAffiliateLink) return eventAffiliateLink;

  const provider = resolveAffiliateProvider(destination);
  if (provider === "sovrn") return destination;

  const template = provider ? PROVIDER_TEMPLATE_ENV[provider] : undefined;
  if (!template) return null;

  const publisherId = process.env.NEXT_PUBLIC_IMPACT_PUBLISHER_ID ?? "";
  const tracked = template
    .replaceAll("{url}", encodeURIComponent(destination))
    .replaceAll("{rawUrl}", destination)
    .replaceAll("{publisherId}", encodeURIComponent(publisherId))
    .replaceAll("{subId}", encodeURIComponent(subId ?? ""));

  // A malformed template must never fall back to an untracked destination.
  return normalizeHttpsUrl(tracked);
}
