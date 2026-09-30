import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8")
    .replace(/^import \{ createClient \} from .*;\n/m, "")
    .replace(/export default \{ fetch: handler \};/, "globalThis.sync = { fetchTicketmasterEvents, selectEligibleEvents };");

function loadSync(fetch) {
    const context = { Deno: { env: { get: () => "test-key" } }, fetch, URL, URLSearchParams, Date, console };
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