import { describe, expect, it } from "vitest";
import { normalizeEventsPage } from "@/lib/events-pagination";

describe("normalizeEventsPage", () => {
  it("clamps requested pages to the available range", () => {
    expect(normalizeEventsPage("2", 4)).toBe(2);
    expect(normalizeEventsPage("99", 4)).toBe(4);
    expect(normalizeEventsPage("0", 4)).toBe(1);
    expect(normalizeEventsPage("invalid", 4)).toBe(1);
  });
});
