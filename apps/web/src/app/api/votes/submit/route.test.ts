import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { GET as getTotals } from "../totals/route";
import { GET as getHealth } from "../health/route";
import { POST as resetVotes } from "../admin/reset/route";

describe("retired voting API", () => {
  it("rejects vote submissions without processing them", async () => {
    const response = await POST();
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "voting_retired" });
  });

  it("retires all other vote endpoints without accessing vote storage", async () => {
    for (const response of await Promise.all([getTotals(), getHealth(), resetVotes()])) {
      expect(response.status).toBe(410);
      expect(await response.json()).toEqual({ error: "voting_retired" });
    }
  });
});