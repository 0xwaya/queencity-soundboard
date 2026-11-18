import { afterEach, describe, expect, it, vi } from "vitest";

const TM = "https://www.ticketmaster.com/event/abc123";
const ID = "d1dbba2f-2cfc-4451-96e3-f2efae804a6c";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("goHref", () => {
  it("routes tracked ticket links through /go with the placement", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://ticketmaster.evyy.net/c/1/2/3?u={url}&subId1={subId}");
    const { goHref } = await import("@/lib/go");
    expect(goHref(ID, TM, "Event Page")).toBe(`/go/${ID}?p=event-page`);
  });

  it("returns null when there is no affiliate program or no event id", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "");
    const { goHref } = await import("@/lib/go");
    expect(goHref(ID, TM, "sticky")).toBeNull();
    expect(goHref(undefined, TM, "sticky")).toBeNull();
  });
});

describe("looksLikeBot / referrerHost", () => {
  it("flags crawlers and missing user agents", async () => {
    const { looksLikeBot } = await import("@/lib/go");
    expect(looksLikeBot("Googlebot/2.1")).toBe(true);
    expect(looksLikeBot(null)).toBe(true);
    expect(looksLikeBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(false);
  });

  it("keeps only the referrer host", async () => {
    const { referrerHost } = await import("@/lib/go");
    expect(referrerHost("https://www.tiktok.com/@qcsoundboard?x=1")).toBe("www.tiktok.com");
    expect(referrerHost("not a url")).toBeNull();
  });
});
