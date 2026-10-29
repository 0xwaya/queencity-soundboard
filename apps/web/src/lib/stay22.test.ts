import { describe, expect, it } from "vitest";
import { buildStay22MapUrl, isStay22Venue } from "@/lib/stay22";

const show = (name: string) => ({
  id: "evt-1",
  event_date: "2026-11-01T00:30:00.000Z",
  venues: { name, city: "Cincinnati", state: "OH" },
});

describe("stay22", () => {
  it("only targets arenas, stadiums and Riverbend", () => {
    expect(isStay22Venue("Heritage Bank Center")).toBe(true);
    expect(isStay22Venue("Paycor Stadium")).toBe(true);
    expect(isStay22Venue("Truist Arena")).toBe(true);
    expect(isStay22Venue("Riverbend Music Center")).toBe(true);
    expect(isStay22Venue("The Andrew J Brady Music Center")).toBe(true);
    expect(isStay22Venue("Great American Ball Park")).toBe(true);
    expect(isStay22Venue("Bogart's")).toBe(false);
    expect(isStay22Venue("Taft Theatre")).toBe(false);
  });

  it("renders nothing without an aid", () => {
    expect(buildStay22MapUrl(show("Paycor Stadium"), null)).toBeNull();
  });

  it("builds the embed with Eastern check-in dates", () => {
    const url = new URL(buildStay22MapUrl(show("Paycor Stadium"), "qcs")!);
    expect(url.origin + url.pathname).toBe("https://www.stay22.com/embed/gm");
    expect(url.searchParams.get("aid")).toBe("qcs");
    expect(url.searchParams.get("address")).toBe("Paycor Stadium, Cincinnati, OH");
    expect(url.searchParams.get("checkin")).toBe("2026-10-31");
    expect(url.searchParams.get("checkout")).toBe("2026-11-01");
  });
});
