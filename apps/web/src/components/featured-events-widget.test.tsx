import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "@vercel/analytics";
import FeaturedEventsWidget from "@/components/featured-events-widget";
import EventEngagement from "@/components/event-engagement";
import type { EventItem } from "@/lib/supabase";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));
vi.mock("@/components/event-backdrop", () => ({ default: () => null }));

const sponsored = (id: string): EventItem => ({
  id, title: `Sponsored ${id}`, artist_name: "Artist", description: null, hero_image_url: null,
  event_date: "2026-10-05T20:00:00Z", status: "published", venue_id: null,
  is_promoted: true, promoted_until: "2026-10-04T20:00:00Z",
});

let observerCallback: IntersectionObserverCallback;
const disconnect = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-03T12:00:00Z"));
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { observerCallback = callback; }
    observe = vi.fn();
    disconnect = disconnect;
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function notifyVisibility(ratio: number) {
  act(() => observerCallback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver));
}

describe("FeaturedEventsWidget", () => {
  it("shows no sponsored inventory for organic or expired events", () => {
    render(<FeaturedEventsWidget events={[{ ...sponsored("expired"), promoted_until: "2026-10-02T20:00:00Z" }]} />);
    expect(screen.queryByRole("region", { name: "Sponsored events" })).not.toBeInTheDocument();
  });

  it("links at most three sponsored slots to their events and attributes clicks", () => {
    render(<FeaturedEventsWidget events={["one", "two", "three", "four"].map(sponsored)} surface="calendar" />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    const link = screen.getByRole("link", { name: "Sponsored one" });
    expect(link).toHaveAttribute("href", "/events/one");
    fireEvent.click(link);
    expect(track).toHaveBeenCalledWith("sponsor_click", expect.objectContaining({ event_id: "one", surface: "calendar" }));
  });
});

describe("EventEngagement", () => {
  it("does not count hidden-tab visibility or an unmounted placement", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const view = render(<EventEngagement event="sponsored_impression" eventId="one" surface="home"><span>Ad</span></EventEngagement>);
    notifyVisibility(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(track).not.toHaveBeenCalled();
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(500));
    view.unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(track).not.toHaveBeenCalled();
  });

  it("counts an impression only after one continuous second at half visibility", () => {
    render(<EventEngagement event="sponsored_impression" eventId="one" surface="home" campaignId="campaign"><span>Ad</span></EventEngagement>);
    notifyVisibility(0.49);
    act(() => vi.advanceTimersByTime(1000));
    expect(track).not.toHaveBeenCalled();
    notifyVisibility(0.5);
    act(() => vi.advanceTimersByTime(500));
    notifyVisibility(0);
    act(() => vi.advanceTimersByTime(1000));
    expect(track).not.toHaveBeenCalled();
    notifyVisibility(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(track).toHaveBeenCalledWith("sponsored_impression", { event_id: "one", surface: "home", campaign_id: "campaign" });
    notifyVisibility(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("deduplicates event views across remounts within a session and cleans up observation", () => {
    const view = render(<EventEngagement event="event_view" eventId="one" surface="event_detail"><span>Event</span></EventEngagement>);
    notifyVisibility(1);
    act(() => vi.advanceTimersByTime(1000));
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
    render(<EventEngagement event="event_view" eventId="one" surface="event_detail"><span>Event</span></EventEngagement>);
    act(() => vi.advanceTimersByTime(1000));
    expect(track).toHaveBeenCalledTimes(1);
  });
});