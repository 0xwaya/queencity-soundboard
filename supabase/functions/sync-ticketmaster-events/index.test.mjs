import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
    .replace(/^import \{ createClient \} from .*;\n/m, "")
    .replace(/export default \{ fetch: handler \};/, "globalThis.sync = { fetchTicketmasterEvents, selectEligibleEvents, resolveCategory, buildDescription, resolveEventSchedule, resolveStoredDescription };");

function loadSync(fetch) {
    const context = { Deno: { env: { get: () => "test-key" } }, fetch, URL, URLSearchParams, Date, Intl, console };
    runInNewContext(stripTypeScriptTypes(source), context);
    return context.sync;
}

function show(name, venue, date, rank, id = name) {
    return {
        event: {
            id,
            name,
            url: "https://www.ticketmaster.com/event/test",
            dates: { start: { dateTime: date }, status: { code: "onsale" } },
            classifications: [{ segment: { name: "Music" }, genre: { name: "Rock" } }],
            _embedded: { venues: [{ name: venue }] },
        },
        category: "rock",
        relevanceRank: rank,
    };
}

test("music pages and the Ludlow venue search reach beyond the first result page", async () => {
    const queries = [];
    const { fetchTicketmasterEvents } = loadSync(async (url) => {
        const request = new URL(url);
        queries.push(request.searchParams);
        if (request.pathname.endsWith("venues.json")) {
            return { ok: true, json: async () => ({ _embedded: { venues: [{ id: "ludlow-id", name: "The Ludlow Garage", city: { name: "Cincinnati" }, state: { stateCode: "OH" } }] } }) };
        }
        const page = Number(request.searchParams.get("page"));
        const venueId = request.searchParams.get("venueId");
        const event = show(venueId ? "Ludlow show" : `Show ${page}`, venueId ? "The Ludlow Garage" : "Other venue", "2026-10-01T20:00:00Z", page + 1, venueId ? "ludlow" : `page-${page}`);
        return { ok: true, json: async () => ({ page: { totalPages: venueId ? 1 : 2 }, _embedded: { events: [event.event] } }) };
    });

    const result = await fetchTicketmasterEvents();
    assert.equal(queries.filter((query) => query.get("classificationName") === "Music" && !query.has("venueId")).length, 2);
    assert.ok(queries.some((query) => query.get("venueId") === "ludlow-id" && query.get("startDateTime")));
    assert.ok(result.events.some(({ event }) => event.id === "ludlow"));
});

test("selection keeps the earliest showing and distributes music across venues", () => {
    const { selectEligibleEvents } = loadSync(() => { throw new Error("unexpected request"); });
    const candidates = [
        show("Same act", "Ludlow Garage", "2026-10-03T20:00:00Z", 2, "late"),
        show("Same act", "The Ludlow Garage", "2026-10-01T20:00:00Z", 1, "early"),
        ...Array.from({ length: 7 }, (_, index) => show(`Ludlow ${index}`, "Ludlow Garage", `2026-10-${String(index + 4).padStart(2, "0")}T20:00:00Z`, index + 3)),
        show("NKY act", "Southgate House Revival", "2026-10-12T20:00:00Z", 12),
    ];
    const result = selectEligibleEvents(candidates, Date.parse("2026-09-30T00:00:00Z"));
    const ids = Array.from(result.events, ({ event }) => event.id);
    assert.ok(ids.includes("early") && !ids.includes("late") && ids.includes("NKY act"));
    assert.equal(result.skipped.duplicateShow, 1);
    assert.equal(result.skipped.overVenueLimit, 2);
});

test("date-first selection fills the music limit across genres", () => {
    const { selectEligibleEvents } = loadSync(() => { throw new Error("unexpected request"); });
    const genres = ["rock", "jazz", "pop", "edm"];
    const candidates = Array.from({ length: 100 }, (_, index) => {
        const candidate = show(`Act ${index}`, `Venue ${index}`, new Date(Date.parse("2026-10-01T20:00:00Z") + index * 3600000).toISOString(), index + 1);
        candidate.category = genres[index % genres.length];
        return candidate;
    });
    const result = selectEligibleEvents(candidates, Date.parse("2026-09-30T00:00:00Z"));
    assert.equal(result.events.length, 80);
    assert.equal(result.skipped.overMusicLimit, 20);
    assert.deepEqual(JSON.parse(JSON.stringify(result.categoryCounts)), { rock: 20, jazz: 20, pop: 20, edm: 20 });
});

test("selection drops add-on listings and second listings for the same venue and start time", () => {
    const { selectEligibleEvents } = loadSync(() => { throw new Error("unexpected request"); });
    const sports = (name, date, rank, id) => {
        const candidate = show(name, "Paycor Stadium", date, rank, id);
        candidate.event.classifications = [{ segment: { name: "Sports" } }];
        candidate.category = "sports";
        return candidate;
    };
    const candidates = [
        sports("USMNT v Haiti", "2026-11-18T00:00:00Z", 1, "a"),
        sports("USMNT v TBD", "2026-11-18T00:00:00Z", 2, "b"),
        sports("Bengals Parking Pass", "2026-11-19T00:00:00Z", 3, "c"),
        ...Array.from({ length: 15 }, (_, index) => sports(`Game ${index}`, `2026-12-${String(index + 1).padStart(2, "0")}T00:00:00Z`, index + 4, `g${index}`)),
    ];
    const result = selectEligibleEvents(candidates, Date.parse("2026-10-01T00:00:00Z"));
    const names = result.events.map(({ event }) => event.name);
    assert.ok(names.includes("USMNT v Haiti"));
    assert.ok(!names.includes("USMNT v TBD"));
    assert.ok(!names.includes("Bengals Parking Pass"));
    assert.equal(result.skipped.sameVenueAndTime, 1);
    assert.equal(result.skipped.addOnListing, 1);
    // More than the old ten-per-category cap now fits.
    assert.equal(names.length, 16);
});

test("genres behind the old 'other' bucket map to real categories (case study #13)", () => {
    const { resolveCategory } = loadSync(async () => ({ ok: true, json: async () => ({}) }));
    const music = (genre, subGenre) => [{ primary: true, segment: { name: "Music" }, genre: { name: genre }, subGenre: { name: subGenre } }];
    assert.equal(resolveCategory(music("Alternative", "Alternative Rock")), "alternative");
    assert.equal(resolveCategory(music("Metal", "Heavy Metal")), "metal");
    assert.equal(resolveCategory(music("Blues", "Blues")), "jazz");
    assert.equal(resolveCategory(music("Folk", "Folk")), "folk");
    assert.equal(resolveCategory(music("Undefined", "Hard Rock")), "rock");
    assert.equal(resolveCategory(music("Other", "Other")), "other");
    assert.equal(resolveCategory([{ segment: { name: "Sports" }, genre: { name: "Football" } }]), "sports");
});

test("every synced event gets a description (case study #13)", () => {
    const { buildDescription } = loadSync(async () => ({ ok: true, json: async () => ({}) }));
    const base = {
        name: "Clutch",
        classifications: [{ segment: { name: "Music" }, genre: { name: "Rock" }, subGenre: { name: "Hard Rock" } }],
        _embedded: { venues: [{ name: "The Andrew J Brady Music Center", city: { name: "Cincinnati" }, state: { stateCode: "OH" } }] },
    };
    assert.equal(buildDescription({ ...base, info: "  All ages.\n Doors 7pm. " }, "rock"), "All ages. Doors 7pm.");
    assert.equal(
        buildDescription(base, "rock"),
        "Clutch: Hard Rock event at The Andrew J Brady Music Center, Cincinnati, OH. Official tickets through Ticketmaster.",
    );
    assert.ok(buildDescription({ ...base, info: "x".repeat(900) }, "rock").length <= 600);
});

test("pleaseNote show time replaces a doors-time dateTime in America/New_York", () => {
    const { resolveEventSchedule } = loadSync(async () => ({ ok: true, json: async () => ({}) }));
    // 7:00 PM EST on Nov 14, 2026 is the Ticketmaster start (doors). The note says the show is 8:00 PM.
    const schedule = resolveEventSchedule({
        name: "Clutch",
        pleaseNote: "7:00 PM doors / 8:00 PM show",
        dates: {
            timezone: "America/New_York",
            start: { dateTime: "2026-11-15T00:00:00.000Z", localDate: "2026-11-14" },
        },
    });
    assert.equal(schedule.eventDate, "2026-11-15T01:00:00.000Z");
    assert.equal(schedule.doorsLabel, "7:00 PM");
    assert.equal(schedule.showLabel, "8:00 PM");
    assert.equal(schedule.description, "Doors 7:00 PM · Show 8:00 PM ET");
});

test("a doors access window keeps start.dateTime as the show and labels both times", () => {
    const { resolveEventSchedule } = loadSync(async () => ({ ok: true, json: async () => ({}) }));
    const schedule = resolveEventSchedule({
        name: "Clutch",
        dates: {
            timezone: "America/New_York",
            start: { dateTime: "2026-11-15T01:00:00.000Z", localDate: "2026-11-14" },
            access: { startDateTime: "2026-11-15T00:00:00.000Z" },
        },
    });
    assert.equal(schedule.eventDate, "2026-11-15T01:00:00.000Z");
    assert.equal(schedule.description, "Doors 7:00 PM · Show 8:00 PM ET");
});

test("eligibility uses the resolved show time, so a show still on sale after doors is kept", () => {
    const { selectEligibleEvents } = loadSync(() => { throw new Error("unexpected request"); });
    const candidate = show("Late show", "Bogart's", "2026-10-01T23:00:00.000Z", 1, "bogarts");
    candidate.event.pleaseNote = "7:00 PM doors / 8:00 PM show";
    candidate.event.dates.timezone = "America/New_York";
    candidate.event.dates.start.localDate = "2026-10-01";
    // 7:30 PM EDT is after doors (7:00 PM) and before the show (8:00 PM).
    const result = selectEligibleEvents([candidate], Date.parse("2026-10-01T23:30:00.000Z"));
    assert.equal(result.events.length, 1);
    assert.equal(result.skipped.notFuture, 0);
});

test("off-sale events are still skipped", () => {
    const { selectEligibleEvents } = loadSync(() => { throw new Error("unexpected request"); });
    const candidate = show("Off sale", "Bogart's", "2026-12-01T00:00:00.000Z", 1, "offsale");
    candidate.event.dates.status.code = "offsale";
    const result = selectEligibleEvents([candidate], Date.parse("2026-10-01T00:00:00.000Z"));
    assert.equal(result.events.length, 0);
    assert.equal(result.skipped.notOnSale, 1);
});

test("doors/show line and rescheduled notes win over the generated description", () => {
    const { resolveStoredDescription, buildDescription } = loadSync(async () => ({ ok: true, json: async () => ({}) }));
    const fallback = buildDescription({
        name: "Clutch",
        info: "All ages. Doors 7pm.",
        classifications: [{ segment: { name: "Music" }, genre: { name: "Rock" } }],
    }, "rock");
    assert.equal(
        resolveStoredDescription("Doors 7:00 PM · Show 8:00 PM ET", null, fallback),
        "Doors 7:00 PM · Show 8:00 PM ET",
    );
    assert.equal(
        resolveStoredDescription("Doors 7:00 PM · Show 8:00 PM ET", "Show rescheduled to Friday", fallback),
        "Show rescheduled to Friday",
    );
    assert.equal(resolveStoredDescription(null, "Hand-written note", fallback), undefined);
    assert.equal(resolveStoredDescription(null, null, fallback), fallback);
});
