import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("newsletter scaffold", () => {
  it("stays off without the flag even when keys exist", async () => {
    vi.stubEnv("NEXT_PUBLIC_NEWSLETTER_ENABLED", "");
    vi.stubEnv("BEEHIIV_API_KEY", "k");
    vi.stubEnv("BEEHIIV_PUBLICATION_ID", "p");
    const { getNewsletterProvider, isNewsletterEnabled } = await import("@/lib/newsletter");
    expect(isNewsletterEnabled()).toBe(false);
    expect(getNewsletterProvider()).toBeNull();
  });

  it("needs both the flag and the provider keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_NEWSLETTER_ENABLED", "true");
    vi.stubEnv("BEEHIIV_API_KEY", "");
    const { getNewsletterProvider } = await import("@/lib/newsletter");
    expect(getNewsletterProvider()).toBeNull();
  });

  it("validates email and rejects the honeypot", async () => {
    const { newsletterSignupSchema } = await import("@/lib/newsletter");
    expect(newsletterSignupSchema.safeParse({ email: " Fan@Example.com " }).data?.email).toBe("fan@example.com");
    expect(newsletterSignupSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(newsletterSignupSchema.safeParse({ email: "a@b.co", company: "spam inc" }).success).toBe(false);
  });
});
