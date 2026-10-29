import { describe, expect, it } from "vitest";
import {
  dedupeSyncedShows,
  getHomepageEvents,
  getSimilarEvents,
  getSponsoredEvents,
  isEventId,
  isPromotionActive,
  isPublicUpcomingEvent,
} from "@/lib/data";
import type { EventItem } from "@/lib/supabase";

const event = (overrides: Partial<EventItem> = {}): EventItem => ({
  id: "event-1",
  title: "Live show",
  artist_name: "Local artist",
  description: null,
  hero_image_url: null,
  event_date: "2026-10-01T20:00:00.000Z",
  status: "published",
  venue_id: "venue-1",
  venues: { id: "venue-1", name: "Ludlow Garage", city: "Cincinnati", state: "OH", is_active: true },
  ...overrides,
});

describe("getHomepageEvents", () => {
  it("prioritizes the soonest events regardless of promotion order", () => {
    const later = event({ id: "later", event_date: "2026-10-03T20:00:00.000Z", is_promoted: true });
    const today = event({ id: "today", event_date: "2026-09-28T23:00:00.000Z" });
    const soon = event({ id: "soon", event_date: "2026-09-29T20:00:00.000Z" });

    const now = new Date("2026-09-28T18:00:00.000Z").getTime();
    expect(getHomepageEvents([later, soon, today], 2, now).map(({ id }) => id)).toEqual(["today", "soon"]);
  });
});

describe("dedupeSyncedShows", () => {
  it("keeps the earliest showing at a venue without hiding other venues or manual listings", () => {
    const later = event({ id: "later", title: "Artist Live", source: "sync", event_date: "2026-10-03T20:00:00.000Z" });
    const earlier = event({ id: "earlier", title: "Artist Live", source: "sync", event_date: "2026-10-01T20:00:00.000Z" });
    const otherVenue = event({ id: "other", title: "Artist Live", source: "sync", venue_id: "venue-2", venues: { id: "venue-2", name: "Southgate House Revival", city: "Newport", state: "KY" }, event_date: "2026-10-02T20:00:00.000Z" });
    const manual = event({ id: "manual", title: "Artist Live", source: "manual", event_date: "2026-10-02T21:00:00.000Z" });
    const alias = event({ id: "alias", title: "Artist Live", source: "sync", venue_id: "venue-3", venues: { id: "venue-3", name: "The Ludlow Garage", city: "Cincinnati", state: "OH" }, event_date: "2026-10-04T20:00:00.000Z" });

    expect(dedupeSyncedShows([later, otherVenue, manual, earlier, alias]).map(({ id }) => id)).toEqual([
      "earlier", "other", "manual",
    ]);
  });
});

describe("isPublicUpcomingEvent", () => {
  const now = new Date("2026-09-26T12:00:00.000Z").getTime();

  it("keeps verified future events at active venues", () => {
    expect(isPublicUpcomingEvent(event(), now)).toBe(true);
  });

  it("hides expired events", () => {
    expect(isPublicUpcomingEvent(event({ event_date: "2026-09-25T23:59:00.000Z" }), now)).toBe(false);
  });

  it("keeps events earlier on the current Cincinnati calendar day", () => {
    const afternoon = new Date("2026-09-26T18:00:00.000Z").getTime();
    expect(isPublicUpcomingEvent(event({ event_date: "2026-09-26T14:00:00.000Z" }), afternoon)).toBe(true);
  });

  it("hides events at retired or inactive venues", () => {
    expect(isPublicUpcomingEvent(event({ venues: { id: "old", name: "Madison Theater", city: "Covington", state: "KY", is_active: true } }), now)).toBe(false);
    expect(isPublicUpcomingEvent(event({ venues: { id: "old", name: "Closed Venue", city: null, state: null, is_active: false } }), now)).toBe(false);
  });
});

describe("isPromotionActive", () => {
  const now = new Date("2026-09-26T12:00:00.000Z").getTime();

  it("is false when the event was never promoted", () => {
    expect(isPromotionActive(event(), now)).toBe(false);
  });

  it("keeps an open-ended promotion active", () => {
    expect(isPromotionActive(event({ is_promoted: true }), now)).toBe(true);
  });

  it("keeps a promotion active until its end date passes", () => {
    expect(isPromotionActive(event({ is_promoted: true, promoted_until: "2026-09-27T00:00:00.000Z" }), now)).toBe(true);
    expect(isPromotionActive(event({ is_promoted: true, promoted_until: "2026-09-25T00:00:00.000Z" }), now)).toBe(false);
  });
});
describe("event detail helpers", () => {
  it("only accepts uuid ids", () => {
    expect(isEventId("d1dbba2f-2cfc-4451-96e3-f2efae804a6c")).toBe(true);
    expect(isEventId("xyz")).toBe(false);
    expect(isEventId("../etc")).toBe(false);
  });

  it("suggests same-category or same-venue shows in the next two weeks", () => {
    const now = new Date("2026-10-29T12:00:00.000Z").getTime();
    const target = event({ id: "t", category: "rock", venue_id: "v1" });
    const sameBoth = event({ id: "both", category: "rock", venue_id: "v1", event_date: "2026-11-05T00:00:00.000Z" });
    const sameCat = event({ id: "cat", category: "rock", venue_id: "v2", event_date: "2026-10-30T00:00:00.000Z" });
    const unrelated = event({ id: "no", category: "comedy", venue_id: "v3", event_date: "2026-10-30T00:00:00.000Z" });
    const tooFar = event({ id: "far", category: "rock", venue_id: "v1", event_date: "2026-12-30T00:00:00.000Z" });
    expect(getSimilarEvents(target, [target, sameCat, unrelated, tooFar, sameBoth], 3, 14, now).map(({ id }) => id)).toEqual([
      "both",
      "cat",
    ]);
  });
});

describe("getTonightEvents", () => {
  const base = { artist_name: "", description: null, hero_image_url: null, status: "published" as const, venue_id: null };
  // 2026-10-29 18:00 ET
  const now = Date.parse("2026-10-29T22:00:00Z");

  it("returns today's Eastern-date shows, promoted first then by time", async () => {
    const { getTonightEvents } = await import("@/lib/data");
    const result = getTonightEvents(
      [
        { ...base, id: "a", title: "Late", event_date: "2026-10-30T02:00:00Z" },
        { ...base, id: "b", title: "Early", event_date: "2026-10-29T23:00:00Z" },
        { ...base, id: "c", title: "Promo", event_date: "2026-10-30T01:00:00Z", is_promoted: true },
        { ...base, id: "d", title: "Tomorrow", event_date: "2026-10-30T23:00:00Z" },
      ],
      now,
    );
    expect(result.isToday).toBe(true);
    expect(result.day).toBe("2026-10-29");
    expect(result.events.map((event) => event.id)).toEqual(["c", "b", "a"]);
  });

  it("falls back to the next date with shows", async () => {
    const { getTonightEvents } = await import("@/lib/data");
    const result = getTonightEvents([{ ...base, id: "d", title: "Tomorrow", event_date: "2026-10-30T23:00:00Z" }], now);
    expect(result.isToday).toBe(false);
    expect(result.events.map((event) => event.id)).toEqual(["d"]);
  });
});

describe("getSponsoredEvents", () => {
  const now = new Date("2026-09-26T12:00:00.000Z").getTime();

  it("keeps only active, upcoming paid placements, capped at the slot count", () => {
    const events = [
      event({ id: "a", is_promoted: true, promoted_until: "2026-10-01T00:00:00.000Z" }),
      event({ id: "expired", is_promoted: true, promoted_until: "2026-09-20T00:00:00.000Z" }),
      event({ id: "free" }),
      event({ id: "past", is_promoted: true, event_date: "2026-09-20T20:00:00.000Z" }),
      event({ id: "b", is_promoted: true }),
      event({ id: "c", is_promoted: true }),
      event({ id: "d", is_promoted: true }),
    ];
    expect(getSponsoredEvents(events, 3, now).map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});
