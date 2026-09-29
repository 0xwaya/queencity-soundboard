import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { buildPageMetadata } from "@/lib/seo";

describe("SEO metadata", () => {
  it("sets a canonical URL without claiming separate language URLs", () => {
    const metadata = buildPageMetadata({
      title: "Events",
      description: "Upcoming events in Cincinnati and Northern Kentucky.",
      path: "/events",
    });

    expect(metadata.alternates).toEqual({ canonical: "/events" });
  });

  it("does not mark every sitemap page as modified on each request", () => {
    expect(sitemap().every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});
