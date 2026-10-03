import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPublishedEvents } from "@/lib/data";
import EventPage, { generateMetadata } from "./page";
import type { EventItem } from "@/lib/supabase";

vi.mock("@/lib/data", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/data")>(), getPublishedEvents: vi.fn() }));
vi.mock("@/lib/i18n", () => ({ getLocale: async () => "en" }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/components/event-backdrop", () => ({ default: () => null }));
vi.mock("@/components/event-engagement", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/ticket-widget", () => ({ default: ({ eventId }: { eventId: string }) => <div data-testid="tickets">{eventId}</div> }));

const id = "fd4b1fff-9bf5-4e33-8a45-64d8e68e9686";
const event: EventItem = {
  id, title: "Local concert", artist_name: "Local artist", description: "Event information",
  hero_image_url: null, event_date: "2026-10-05T20:00:00Z", status: "published", venue_id: null,
};
const props = { params: Promise.resolve({ id }) };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-03T12:00:00Z"));
  vi.mocked(getPublishedEvents).mockResolvedValue({ data: [event], error: null });
});

afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

describe("EventPage", () => {
  it("shows the specific published event and its canonical destination", async () => {
    render(await EventPage(props));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(event.title);
    expect(screen.getByTestId("tickets")).toHaveTextContent(id);
    const metadata = await generateMetadata(props);
    expect(metadata.alternates?.canonical).toBe(`/events/${id}`);
  });

  it.each([
    { status: "draft" as const },
    { status: "archived" as const },
    { event_date: "2026-10-01T20:00:00Z" },
    { venues: { id: "closed", name: "Closed", city: null, state: null, is_active: false } },
  ])("does not expose a hidden event: %j", async (overrides) => {
    vi.mocked(getPublishedEvents).mockResolvedValue({ data: [{ ...event, ...overrides }], error: null });
    await expect(EventPage(props)).rejects.toThrow("NOT_FOUND");
  });

  it("rejects invalid and unknown identifiers", async () => {
    await expect(EventPage({ params: Promise.resolve({ id: "invalid" }) })).rejects.toThrow("NOT_FOUND");
    vi.mocked(getPublishedEvents).mockResolvedValue({ data: [], error: null });
    await expect(EventPage(props)).rejects.toThrow("NOT_FOUND");
  });

  it("does not turn a data outage into a cacheable missing event", async () => {
    vi.mocked(getPublishedEvents).mockResolvedValue({ data: [], error: "Unable to load events right now." });
    await expect(EventPage(props)).rejects.toThrow("Unable to load events right now.");
  });
});