import { describe, expect, it } from "vitest";
import { getHomepageEvents, isPromotionActive, isPublicUpcomingEvent } from "@/lib/data";
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