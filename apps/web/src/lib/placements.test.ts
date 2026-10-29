import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("placements", () => {
  it("defaults to a $25/week Featured Event", async () => {
    const { FEATURED_EVENT_PLACEMENT, formatPlacementPrice } = await import("@/lib/placements");
    expect(FEATURED_EVENT_PLACEMENT.priceUsd).toBe(25);
    expect(formatPlacementPrice()).toBe("$25 / week");
  });

  it("only exposes an https payment link", async () => {
    vi.stubEnv("NEXT_PUBLIC_PLACEMENT_PAYMENT_URL", "");
    let mod = await import("@/lib/placements");
    expect(mod.placementPaymentUrl()).toBeNull();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_PLACEMENT_PAYMENT_URL", "javascript:alert(1)");
    mod = await import("@/lib/placements");
    expect(mod.placementPaymentUrl()).toBeNull();
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_PLACEMENT_PAYMENT_URL", "https://buy.stripe.com/test_123");
    mod = await import("@/lib/placements");
    expect(mod.placementPaymentUrl()).toBe("https://buy.stripe.com/test_123");
  });
});
