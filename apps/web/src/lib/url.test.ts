import { describe, expect, it } from "vitest";
import { normalizeHttpsUrl, normalizeImageUrl } from "@/lib/url";

describe("normalizeHttpsUrl", () => {
  it("returns normalized HTTPS URLs", () => {
    expect(normalizeHttpsUrl("https://example.com/tickets")).toBe("https://example.com/tickets");
  });

  it("rejects non-HTTPS URLs", () => {
    expect(normalizeHttpsUrl("http://example.com/tickets")).toBeNull();
    expect(normalizeHttpsUrl("javascript:alert('xss')")).toBeNull();
  });

  it("returns null for invalid or empty values", () => {
    expect(normalizeHttpsUrl("")).toBeNull();
    expect(normalizeHttpsUrl("not-a-url")).toBeNull();
    expect(normalizeHttpsUrl(null)).toBeNull();
    expect(normalizeHttpsUrl(undefined)).toBeNull();
  });
});

describe("normalizeImageUrl", () => {
  it("keeps local asset paths", () => {
    expect(normalizeImageUrl("/proyecto-uno-live.jpg")).toBe("/proyecto-uno-live.jpg");
  });

  it("keeps HTTPS remote images", () => {
    expect(normalizeImageUrl("https://s1.ticketm.net/dam/a/abc/hero.jpg")).toBe(
      "https://s1.ticketm.net/dam/a/abc/hero.jpg",
    );
  });

  it("rejects values that could break out of CSS or markup", () => {
    expect(normalizeImageUrl("/a.jpg');background:url('https://evil.test/x.jpg")).toBeNull();
    expect(normalizeImageUrl('https://a.test/x.jpg"onerror=alert(1)')).toBeNull();
  });

  it("rejects unsafe or protocol-relative sources", () => {
    expect(normalizeImageUrl("//evil.test/x.jpg")).toBeNull();
    expect(normalizeImageUrl("http://insecure.test/x.jpg")).toBeNull();
    expect(normalizeImageUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeImageUrl(null)).toBeNull();
  });
});
