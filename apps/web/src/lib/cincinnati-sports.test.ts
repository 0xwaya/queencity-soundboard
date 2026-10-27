import { afterEach, describe, expect, it, vi } from "vitest";
import { getCincinnatiSports } from "@/lib/cincinnati-sports";

const NOW = Date.parse("2026-10-27T10:00:00Z");

function game(id: string, date: string, name: string, completed: boolean) {
  return { id, date, name, competitions: [{ timeValid: true, status: { type: { completed, shortDetail: completed ? "FT" : "Scheduled" } } }] };
}

afterEach(() => vi.unstubAllGlobals());

describe("getCincinnatiSports", () => {
  it("falls back to ESPN fixtures when the season schedule has no future game (MLS playoffs)", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const fixture = url.includes("fixture=true");
      const isFcc = url.includes("soccer/usa.1");
      const events = isFcc && fixture
        ? [game("p1", "2026-10-31T18:00Z", "Philadelphia Union at FC Cincinnati", false)]
        : [game("old", "2026-10-24T23:30Z", "FC Cincinnati at D.C. United", true)];
      return { ok: true, json: async () => ({ events }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const teams = await getCincinnatiSports(NOW);
    const fcc = teams.find((team) => team.id === "fcc");
    expect(fcc?.upcoming?.name).toBe("Philadelphia Union at FC Cincinnati");
    expect(fcc?.upcoming?.date).toBe("2026-10-31T18:00Z");
    // Teams whose fixtures feed is empty (Reds offseason) still show no upcoming game.
    expect(teams.find((team) => team.id === "reds")?.upcoming).toBeNull();
  });
});
