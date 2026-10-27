import { describe, expect, it } from "vitest";
import { formatEventDate, formatEventDateTime, formatGameDateTime } from "@/lib/time";

describe("formatEventDateTime", () => {
  it("renders Eastern Daylight Time before the DST change", () => {
    expect(formatEventDateTime("2026-10-26T23:00:00Z")).toBe("Mon, Oct 26 · 7:00 PM ET");
  });

  it("renders Eastern Standard Time after the DST change", () => {
    expect(formatEventDateTime("2026-11-05T00:00:00Z")).toBe("Wed, Nov 4 · 7:00 PM ET");
  });

  it("returns an empty string for invalid dates", () => {
    expect(formatEventDateTime("not-a-date")).toBe("");
  });
});

describe("formatEventDate", () => {
  it("uses the Eastern calendar day, not UTC", () => {
    expect(formatEventDate("2026-11-05T00:00:00Z")).toBe("Wed, Nov 4, 2026");
    expect(formatEventDate("2026-10-27T03:30:00Z")).toBe("Mon, Oct 26, 2026");
  });
});

describe("formatGameDateTime", () => {
  it("keeps the minutes of an ESPN kickoff (Utah at Cincinnati, 3:45 PM ET)", () => {
    expect(formatGameDateTime("2026-10-31T19:45Z")).toBe("Sat, Oct 31 · 3:45 PM ET");
  });

  it("shows TBD instead of ESPN's 05:00Z placeholder", () => {
    expect(formatGameDateTime("2026-11-07T05:00Z", false)).toBe("Sat, Nov 7 · Time TBD");
    expect(formatGameDateTime("2026-11-21T05:00Z", false)).toBe("Sat, Nov 21 · Time TBD");
  });
});
