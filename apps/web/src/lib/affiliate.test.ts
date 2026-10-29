import { afterEach, describe, expect, it, vi } from "vitest";

const TICKETMASTER_EVENT = "https://www.ticketmaster.com/event/abc123";

async function importAffiliate() {
  return await import("@/lib/affiliate");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("resolveAffiliateProvider", () => {
  it("identifies supported ticketing hosts, including subdomains", async () => {
    const { resolveAffiliateProvider } = await importAffiliate();
    expect(resolveAffiliateProvider(TICKETMASTER_EVENT)).toBe("ticketmaster");
    expect(resolveAffiliateProvider("https://concerts.livenation.com/x")).toBe("ticketmaster");
    expect(resolveAffiliateProvider("https://seatgeek.com/e/1")).toBe("seatgeek");
  });

  it("does not match lookalike domains", async () => {
    const { resolveAffiliateProvider } = await importAffiliate();
    expect(resolveAffiliateProvider("https://notticketmaster.com/event/1")).toBeNull();
    expect(resolveAffiliateProvider("https://ticketmaster.com.evil.test/event/1")).toBeNull();
  });

  it("rejects unsupported or unsafe URLs", async () => {
    const { resolveAffiliateProvider } = await importAffiliate();
    expect(resolveAffiliateProvider("http://www.ticketmaster.com/event/1")).toBeNull();
    expect(resolveAffiliateProvider("javascript:alert('xss')")).toBeNull();
  });
});

describe("buildAffiliateUrl", () => {
  it("does not expose a direct ticket URL when no template is configured", async () => {
    const { buildAffiliateUrl } = await importAffiliate();
    expect(buildAffiliateUrl(TICKETMASTER_EVENT)).toBeNull();
    expect(buildAffiliateUrl("https://tickets.example.com/e/123")).toBeNull();
  });

  it("applies the configured template with publisher and sub ids", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMPACT_PUBLISHER_ID", "7826925");
    vi.stubEnv(
      "NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER",
      "https://track.example.com/c/{publisherId}/1/2?subId1={subId}&u={url}",
    );
    const { buildAffiliateUrl } = await importAffiliate();

    const result = buildAffiliateUrl(TICKETMASTER_EVENT, "event-42");
    expect(result).toContain("/c/7826925/1/2");
    expect(result).toContain("subId1=event-42");
    expect(result).toContain(`u=${encodeURIComponent(TICKETMASTER_EVENT)}`);
  });

  it("falls back to the destination when a template would downgrade the scheme", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "http://insecure.example.com/?u={url}");
    const { buildAffiliateUrl } = await importAffiliate();
    expect(buildAffiliateUrl(TICKETMASTER_EVENT)).toBeNull();
  });

  it("returns null for missing or unsafe URLs", async () => {
    const { buildAffiliateUrl } = await importAffiliate();
    expect(buildAffiliateUrl(null)).toBeNull();
    expect(buildAffiliateUrl("javascript:alert('xss')")).toBeNull();
  });
});

describe("buildAffiliateUrl click refs", () => {
  const LIVE_STYLE = "https://ticketmaster.evyy.net/c/{publisherId}/264167/4272?u={url}&subId1={subId}";

  it("appends placement, source and shared id to Impact-style templates", async () => {
    vi.stubEnv("NEXT_PUBLIC_IMPACT_PUBLISHER_ID", "7826925");
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", LIVE_STYLE);
    const { buildAffiliateUrl } = await importAffiliate();
    const result = new URL(
      buildAffiliateUrl(TICKETMASTER_EVENT, {
        subId1: "event-42",
        subId2: "event_page",
        subId3: "tiktok-bio",
        sharedid: "ab12-cd34",
      })!,
    );
    expect(result.searchParams.get("u")).toBe(TICKETMASTER_EVENT);
    expect(result.searchParams.get("subId1")).toBe("event-42");
    expect(result.searchParams.get("subId2")).toBe("event_page");
    expect(result.searchParams.get("subId3")).toBe("tiktok-bio");
    expect(result.searchParams.get("sharedid")).toBe("ab12cd34");
  });

  it("keeps the string form working and leaves empty sub ids out", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", LIVE_STYLE);
    const { buildAffiliateUrl } = await importAffiliate();
    const result = new URL(buildAffiliateUrl(TICKETMASTER_EVENT, "event-42")!);
    expect(result.searchParams.get("subId1")).toBe("event-42");
    expect(result.searchParams.has("subId2")).toBe(false);
  });

  it("supports explicit placeholders and does not touch non-Impact templates", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_AFFILIATE_TEMPLATE_STUBHUB",
      "https://prf.hn/click/camref:abc/pubref:{subId}-{subId2}/destination:{url}",
    );
    const { buildAffiliateUrl } = await importAffiliate();
    const result = buildAffiliateUrl("https://www.stubhub.com/event/1", { subId1: "e1", subId2: "resale", subId3: "x" })!;
    expect(result).toContain("pubref:e1-resale");
    expect(result).not.toContain("subId3");
  });

  it("cleans sub id values", async () => {
    const { cleanSubId } = await importAffiliate();
    expect(cleanSubId("  TikTok Bio!! ")).toBe("tiktok-bio");
    expect(cleanSubId("qcs-tt-20261029-fightingside")).toBe("qcs-tt-20261029-fightingside");
    expect(cleanSubId(undefined)).toBe("");
  });
});
