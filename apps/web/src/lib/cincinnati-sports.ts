type EspnCompetitor = {
  team?: { displayName?: string; shortDisplayName?: string; abbreviation?: string };
  score?: string | { displayValue?: string; value?: number };
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  competitions?: Array<{
    status?: { type?: { completed?: boolean; state?: string; shortDetail?: string; name?: string } };
    competitors?: EspnCompetitor[];
  }>;
};

type EspnSchedule = {
  team?: { displayName?: string };
  events?: EspnEvent[];
};

type GameSummary = {
  id: string;
  name: string;
  date: string;
  status: string;
  score: string | null;
};

export type CincinnatiSportsTeam = {
  id: string;
  name: string;
  league: string;
  color: string;
  latest: GameSummary | null;
  upcoming: GameSummary | null;
};

const LOCAL_TEAMS = [
  { id: "reds", name: "Cincinnati Reds", league: "MLB", color: "#c6011f", path: "baseball/mlb/teams/cin" },
  { id: "bengals", name: "Cincinnati Bengals", league: "NFL", color: "#fb4f14", path: "football/nfl/teams/cin" },
  { id: "fcc", name: "FC Cincinnati", league: "MLS", color: "#003087", path: "soccer/usa.1/teams/18267" },
  {
    id: "bearcats",
    name: "Cincinnati Bearcats",
    league: "NCAA Football",
    color: "#e00122",
    path: "football/college-football/teams/2132",
  },
] as const;

function summarizeGame(event: EspnEvent): GameSummary | null {
  if (!event.date) return null;

  const competition = event.competitions?.[0];
  const status = competition?.status?.type;
  const scoreParts = (competition?.competitors ?? []).flatMap((competitor) => {
    const score = typeof competitor.score === "string"
      ? competitor.score
      : competitor.score?.displayValue ?? (competitor.score?.value != null ? String(competitor.score.value) : null);
    const teamName = competitor.team?.shortDisplayName ?? competitor.team?.abbreviation ?? competitor.team?.displayName ?? "Team";
    return score ? [`${teamName} ${score}`] : [];
  });
  return {
    id: event.id ?? `${event.date}-${event.name ?? "game"}`,
    name: event.name ?? "Scheduled game",
    date: event.date,
    status: status?.shortDetail ?? status?.name ?? (status?.completed ? "Final" : "Scheduled"),
    score: scoreParts.length ? scoreParts.join(" · ") : null,
  };
}

async function loadTeamSchedule(
  team: (typeof LOCAL_TEAMS)[number],
  now: number,
): Promise<CincinnatiSportsTeam> {
  const fallback = { id: team.id, name: team.name, league: team.league, color: team.color, latest: null, upcoming: null };

  try {
    const season = new Date(now).getFullYear();
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${team.path}/schedule?season=${season}`,
      { next: { revalidate: 900 } },
    );
    if (!response.ok) return fallback;

    const schedule = (await response.json()) as EspnSchedule;
    const events = (schedule.events ?? [])
      .filter((event) => event.date && Number.isFinite(Date.parse(event.date)))
      .sort((a, b) => Date.parse(a.date!) - Date.parse(b.date!));
    const latestEvent = events
      .filter((event) => Date.parse(event.date!) <= now)
      .filter((event) => {
        const competition = event.competitions?.[0];
        const hasScore = competition?.competitors?.some((competitor) => Boolean(competitor.score));
        return hasScore || competition?.status?.type?.completed || competition?.status?.type?.state === "in";
      })
      .at(-1);
    const upcomingEvent = events.find(
      (event) => Date.parse(event.date!) > now && !event.competitions?.[0]?.status?.type?.completed,
    );

    return {
      ...fallback,
      name: schedule.team?.displayName ?? team.name,
      latest: latestEvent ? summarizeGame(latestEvent) : null,
      upcoming: upcomingEvent ? summarizeGame(upcomingEvent) : null,
    };
  } catch {
    return fallback;
  }
}

export function getCincinnatiSports(now = Date.now()): Promise<CincinnatiSportsTeam[]> {
  return Promise.all(LOCAL_TEAMS.map((team) => loadTeamSchedule(team, now)));
}