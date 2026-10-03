import { getCincinnatiSports } from "@/lib/cincinnati-sports";
import TrackedExternalLink from "@/components/tracked-external-link";
import { buildAffiliateUrl, resolveAffiliateProvider } from "@/lib/affiliate";
import type { CincinnatiSportsTeam } from "@/lib/cincinnati-sports";
import type { EventItem } from "@/lib/supabase";

type Props = {
  events: EventItem[];
};

const TEAM_TICKET_ALIASES: Record<CincinnatiSportsTeam["id"], readonly string[]> = {
  reds: ["cincinnati reds", "reds"],
  bengals: ["cincinnati bengals", "bengals"],
  fcc: ["fc cincinnati", "cincinnati fc", "fcc"],
  bearcats: ["cincinnati bearcats", "bearcats"],
};

function cincinnatiDay(value: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function findTicketmasterEvent(team: CincinnatiSportsTeam, gameDate: string, events: EventItem[]): EventItem | undefined {
  const aliases = TEAM_TICKET_ALIASES[team.id];
  return events.find((event) => {
    if (!event.ticket_url || resolveAffiliateProvider(event.ticket_url) !== "ticketmaster") return false;
    if (cincinnatiDay(event.event_date) !== cincinnatiDay(gameDate)) return false;
    const searchableText = `${event.title} ${event.artist_name} ${event.description ?? ""}`.toLowerCase();
    return aliases.some((alias) => searchableText.includes(alias));
  });
}

function formatGameDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

export default async function CincinnatiSportsCard({ events }: Props) {
  const teams = await getCincinnatiSports();

  return (
    <section className="qcs-ambient-card relative overflow-hidden rounded-2xl border border-white/10 p-4 md:p-5">
      <div className="qcs-card-content">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">Cincinnati Sports</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white">Scores + next games</h2>
          </div>
          <p className="text-[11px] text-slate-400">Reds · Bengals · FC Cincinnati · Bearcats</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {teams.map((team) => (
            <article key={team.id} className="min-w-0 border-l-2 pl-3" style={{ borderColor: team.color }}>
              <div className="flex min-w-0 items-baseline justify-between gap-2">
                <h3 className="truncate text-sm font-bold text-white">{team.name}</h3>
                <p className="shrink-0 text-[10px] font-semibold uppercase text-slate-500">{team.league}</p>
              </div>

              <div className="mt-2">
                {team.latest ? (
                  <p className="truncate text-xs text-slate-300">
                    <span className="font-semibold text-cyan-200">{team.latest.status}:</span> {team.latest.score ?? team.latest.name}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">No recent score</p>
                )}
              </div>

              <div className="mt-2 border-t border-white/10 pt-2">
                {team.upcoming ? (
                  <>
                    <p className="line-clamp-1 text-xs font-semibold text-slate-100">{team.upcoming.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-slate-400">{formatGameDate(team.upcoming.date)}</p>
                      {(() => {
                        const ticketEvent = findTicketmasterEvent(team, team.upcoming.date, events);
                        const ticketUrl = buildAffiliateUrl(
                          ticketEvent?.ticket_url,
                          `sports_${team.id}_${team.upcoming.id}`,
                        );
                        return ticketUrl ? (
                          <TrackedExternalLink
                            href={ticketUrl}
                            event="ticket_click"
                            label={`sports_${team.id}_${team.upcoming.id}_tickets`}
                            properties={{ event_id: ticketEvent?.id ?? null, provider: "ticketmaster", surface: "home_sports" }}
                            target="_blank"
                            rel="sponsored noopener noreferrer"
                            className="shrink-0 rounded-md bg-amber-300 px-2 py-1 text-[10px] font-bold text-[#15120a] hover:bg-amber-200"
                          >
                            Tickets
                          </TrackedExternalLink>
                        ) : null;
                      })()}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">No upcoming game</p>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-500">Scores and schedules via ESPN · Updates every 15 minutes</p>
        <p className="mt-1 text-[10px] text-slate-400">We may earn a commission from ticket links, at no extra cost to you.</p>
      </div>
    </section>
  );
}