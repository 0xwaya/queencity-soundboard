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
    expect(resolveAffiliateProvider("https://www.ticketweb.com/event/14672083")).toBe("ticketweb");
    expect(resolveAffiliateProvider("https://seatgeek.com/e/1")).toBe("seatgeek");
    expect(resolveAffiliateProvider("https://sovrn.co/oak6tu9")).toBe("sovrn");
  });

  it("does not match lookalike domains", async () => {
    const { resolveAffiliateProvider } = await importAffiliate();
    expect(resolveAffiliateProvider("https://notticketmaster.com/event/1")).toBeNull();
    expect(resolveAffiliateProvider("https://ticketmaster.com.evil.test/event/1")).toBeNull();
    expect(resolveAffiliateProvider("https://sovrn.co.evil.test/oak6tu9")).toBeNull();
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

  it("uses the approved Sovrn link for only the exact Mad Viking TicketWeb event", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://track.example.com/?u={url}");
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETWEB", "");
    const { buildAffiliateUrl, hasAffiliateProgram } = await importAffiliate();
    const destination = "https://www.ticketweb.com/event/the-big-whisker-revival-xii-the-southgate-house-revival-tickets/14672083";

    expect(buildAffiliateUrl(destination)).toBe("https://sovrn.co/oak6tu9");
    expect(hasAffiliateProgram(destination)).toBe(true);
    expect(buildAffiliateUrl(`${destination}0`)).toBeNull();
    expect(hasAffiliateProgram(`${destination}0`)).toBe(false);
  });

  it("does not apply the Ticketmaster template to TicketWeb destinations", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://track.example.com/?u={url}");
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETWEB", "");
    const { buildAffiliateUrl } = await importAffiliate();
    expect(buildAffiliateUrl("https://www.ticketweb.com/event/14672083")).toBeNull();
  });

  it("uses a separately configured TicketWeb affiliate template", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETWEB", "https://ticketweb-track.example.com/?u={url}");
    const { buildAffiliateUrl } = await importAffiliate();
    const destination = "https://www.ticketweb.com/event/14672083";
    expect(buildAffiliateUrl(destination)).toBe(`https://ticketweb-track.example.com/?u=${encodeURIComponent(destination)}`);
  });

  it("preserves a Sovrn affiliate link without applying another provider template", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://track.example.com/?u={url}");
    const { buildAffiliateUrl, hasAffiliateProgram } = await importAffiliate();
    const affiliateLink = "https://sovrn.co/oak6tu9";

    expect(buildAffiliateUrl(affiliateLink, "event-42")).toBe(affiliateLink);
    expect(hasAffiliateProgram(affiliateLink)).toBe(true);
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
