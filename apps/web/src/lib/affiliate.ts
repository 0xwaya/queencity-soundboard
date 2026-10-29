/**
 * Multi-program affiliate link builder.
 *
 * Each network (Impact, CJ, Partnerize, ...) issues its own tracking-link format, so the
 * template is supplied per provider via env rather than hardcoded. A template may contain:
 *   {url}         destination, URL-encoded (use for networks that take a deep-link param)
 *   {rawUrl}      destination, not encoded
 *   {publisherId} value of NEXT_PUBLIC_IMPACT_PUBLISHER_ID
 *   {subId}       per-click attribution value (subId1, the event id), URL-encoded
 *   {subId2}      placement of the button that was clicked (optional)
 *   {subId3}      traffic source, e.g. "tiktok-bio" or a post code like "qcs-tt-20261029-x" (optional)
 *   {sharedid}    per-click id, alphanumeric (optional)
 *
 * Impact-style templates (the URL carries a subId1 query param) get subId2, subId3 and
 * sharedid appended automatically when the template does not place them itself, so the
 * existing Ticketmaster template keeps working without an env change.
 *
 * A destination is only returned when its provider has a valid tracking template. This
 * prevents ticket CTAs from silently becoming untracked links.
 */
import { normalizeHttpsUrl } from "@/lib/url";

export type AffiliateProvider = "ticketmaster" | "seatgeek" | "stubhub" | "vividseats" | "axs" | "eventbrite";

const PROVIDER_HOSTS: Record<AffiliateProvider, readonly string[]> = {
  ticketmaster: ["ticketmaster.com", "livenation.com", "ticketweb.com", "frontgatetickets.com"],
  seatgeek: ["seatgeek.com"],
  stubhub: ["stubhub.com"],
  vividseats: ["vividseats.com"],
  axs: ["axs.com"],
  eventbrite: ["eventbrite.com"],
};

const PROVIDER_TEMPLATE_ENV: Record<AffiliateProvider, string | undefined> = {
  ticketmaster: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER,
  seatgeek: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_SEATGEEK,
  stubhub: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_STUBHUB,
  vividseats: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_VIVIDSEATS,
  axs: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_AXS,
  eventbrite: process.env.NEXT_PUBLIC_AFFILIATE_TEMPLATE_EVENTBRITE,
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
  const provider = resolveAffiliateProvider(url);
  return Boolean(provider && PROVIDER_TEMPLATE_ENV[provider]);
}

/** Attribution carried to the affiliate network with each click. */
export type ClickRef = {
  /** Event id. */
  subId1?: string;
  /** Placement, e.g. "event_page", "sticky", "spotlight", "sports_card", "tonight". */
  subId2?: string;
  /** Source, e.g. "tiktok-bio", "newsletter", "organic". */
  subId3?: string;
  /** Per-click id; alphanumeric only (Impact rule). */
  sharedid?: string;
};

const MAX_SUBID_LENGTH = 255;

/** Keep sub ids to a conservative character set so reports stay clean and nothing odd leaks into URLs. */
export function cleanSubId(value?: string | null, max = 64): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, Math.min(max, MAX_SUBID_LENGTH));
}

function normalizeRef(ref: ClickRef | string | undefined): ClickRef {
  if (typeof ref === "string") return { subId1: ref };
  return ref ?? {};
}

export function buildAffiliateUrl(rawUrl?: string | null, ref?: ClickRef | string): string | null {
  const destination = normalizeHttpsUrl(rawUrl);
  if (!destination) return null;

  const provider = resolveAffiliateProvider(destination);
  const template = provider ? PROVIDER_TEMPLATE_ENV[provider] : undefined;
  if (!template) return null;

  const { subId1 = "", subId2 = "", subId3 = "", sharedid = "" } = normalizeRef(ref);
  const sharedIdClean = sharedid.replace(/[^A-Za-z0-9]/g, "").slice(0, MAX_SUBID_LENGTH);
  const publisherId = process.env.NEXT_PUBLIC_IMPACT_PUBLISHER_ID ?? "";
  const tracked = template
    .replaceAll("{url}", encodeURIComponent(destination))
    .replaceAll("{rawUrl}", destination)
    .replaceAll("{publisherId}", encodeURIComponent(publisherId))
    .replaceAll("{subId2}", encodeURIComponent(subId2.slice(0, MAX_SUBID_LENGTH)))
    .replaceAll("{subId3}", encodeURIComponent(subId3.slice(0, MAX_SUBID_LENGTH)))
    .replaceAll("{sharedid}", encodeURIComponent(sharedIdClean))
    .replaceAll("{subId}", encodeURIComponent(subId1.slice(0, MAX_SUBID_LENGTH)));

  // A malformed template must never fall back to an untracked destination.
  const normalized = normalizeHttpsUrl(tracked);
  if (!normalized) return null;

  const url = new URL(normalized);
  if (url.searchParams.has("subId1")) {
    const extras: [string, string][] = [
      ["subId2", subId2],
      ["subId3", subId3],
      ["sharedid", sharedIdClean],
    ];
    for (const [key, value] of extras) {
      if (value && !url.searchParams.get(key)) url.searchParams.set(key, value.slice(0, MAX_SUBID_LENGTH));
    }
  }
  return url.toString();
}
