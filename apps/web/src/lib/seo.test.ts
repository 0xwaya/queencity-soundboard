import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildPageMetadata, SEO } from "@/lib/seo";

describe("SEO metadata", () => {
  it("sets a canonical URL without claiming separate language URLs", () => {
    const metadata = buildPageMetadata({
      title: "Events",
      description: "Upcoming events in Cincinnati and Northern Kentucky.",
      path: "/events",
    });

    expect(metadata.alternates).toEqual({ canonical: "/events" });
  });

  it("does not mark every sitemap page as modified on each request", async () => {
    expect((await sitemap()).every((entry) => entry.lastModified === undefined)).toBe(true);
  });

  it("uses the www host the site is served from as the canonical origin", () => {
    expect(SEO.baseUrl).toBe("https://www.queencitysoundboard.com");
  });
});
