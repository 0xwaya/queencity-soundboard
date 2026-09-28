import { describe, expect, it } from "vitest";
import { isPublicUpcomingEvent } from "@/lib/data";
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

describe("isPublicUpcomingEvent", () => {
  const now = new Date("2026-09-26T12:00:00.000Z").getTime();

  it("keeps verified future events at active venues", () => {
    expect(isPublicUpcomingEvent(event(), now)).toBe(true);
  });

  it("hides expired events", () => {
    expect(isPublicUpcomingEvent(event({ event_date: "2026-09-25T23:59:00.000Z" }), now)).toBe(false);
  });

  it("hides events at retired or inactive venues", () => {
    expect(isPublicUpcomingEvent(event({ venues: { id: "old", name: "Madison Theater", city: "Covington", state: "KY", is_active: true } }), now)).toBe(false);
    expect(isPublicUpcomingEvent(event({ venues: { id: "old", name: "Closed Venue", city: null, state: null, is_active: false } }), now)).toBe(false);
  });
});