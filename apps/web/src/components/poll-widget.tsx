"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";

type VoteCounts = Record<string, number>;

type PollWidgetProps = {
  locale: Locale;
  variant?: "full" | "compact";
};

export default function PollWidget({ locale, variant = "full" }: PollWidgetProps) {
  const [counts, setCounts] = useState<VoteCounts>({});
  const [artists, setArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalVotes = useMemo(() => Object.values(counts).reduce((sum, val) => sum + val, 0), [counts]);

  const copy =
    locale === "es"
      ? {
          eyebrow: "Pulso del publico",
          title: "Quien va despues?",
          body: "Vota tantas veces como quieras por el artista que quieres sumar al proximo showcase.",
          tally: "Conteo en vivo",
          total: "votos totales",
          votes: "votos",
          thanks: "Gracias por votar",
          vote: "Votar",
          rateLimited: "Demasiados votos muy rapido. Intenta de nuevo en breve.",
          loadError: "No se pudieron cargar los votos todavia.",
          voteError: "La votacion fallo. Intenta de nuevo.",
        }
      : {
          eyebrow: "Fan Signal",
          title: "Who should follow?",
          body: "Vote as often as you like for the artist you want added to the next showcase.",
          tally: "Live tally",
          total: "total votes",
          votes: "votes",
          thanks: "Thanks for voting",
          vote: "Vote",
          loadError: "Unable to load votes yet.",
          voteError: "Vote failed. Please try again.",
          rateLimited: "Too many votes too quickly. Try again shortly.",
        };
  const isCompact = variant === "compact";

  const applyTotals = useCallback((totals?: Record<string, number>) => {
    if (!totals) return;

    setArtists(Object.keys(totals));
    const nextCounts: VoteCounts = {};
    Object.entries(totals).forEach(([artist, value]) => {
      const numeric = Number(value);
      nextCounts[artist] = Number.isFinite(numeric) ? numeric : 0;
    });
    setCounts(nextCounts);
  }, []);

  const loadVotes = useCallback(async () => {
    try {
      const response = await fetch("/api/votes/totals", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("vote_totals_failed");

      const payload = (await response.json()) as { totals?: Record<string, number> };
      const totals = payload.totals ?? {};
      setArtists(Object.keys(totals));
      const nextCounts: VoteCounts = {};
      Object.entries(totals).forEach(([artist, value]) => {
        const numeric = Number(value);
        nextCounts[artist] = Number.isFinite(numeric) ? numeric : 0;
      });

      setCounts(nextCounts);
      setError(null);
    } catch (err) {
      console.error("[PollWidget] Failed to load vote totals", err);
      setError(copy.loadError);
    }
  }, [copy.loadError]);

  const handleVote = async (artist: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/votes/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ artist }),
      });

      const payload = (await response.json().catch(() => ({}))) as { totals?: Record<string, number> };

      if (!response.ok) {
        if (response.status === 429) {
          setError(copy.rateLimited);
          return;
        }
        throw new Error("vote_submit_failed");
      }

      applyTotals(payload.totals);
      setSuccess(copy.thanks);
      setError(null);
    } catch (err) {
      console.error("[PollWidget] Failed to submit vote", err);
      setError(copy.voteError);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  useEffect(() => {
    const id = setInterval(() => {
      loadVotes();
    }, 12_000);
    return () => clearInterval(id);
  }, [loadVotes]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#09111f] shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${
        isCompact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className={`flex flex-col ${isCompact ? "gap-3" : "gap-4 md:flex-row md:items-start md:justify-between"}`}>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">{copy.eyebrow}</p>
          <h2 className={`${isCompact ? "mt-1 text-lg" : "mt-2 text-2xl md:text-3xl"} font-extrabold tracking-tight text-white`}>
            {copy.title}
          </h2>
          <p className={`${isCompact ? "mt-1" : "mt-2 max-w-2xl"} text-sm text-slate-300`}>{copy.body}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">{isCompact ? copy.total : copy.tally}</p>
          <p>
            {totalVotes} {isCompact ? "" : copy.total}
          </p>
        </div>
      </div>

      <div className={`${isCompact ? "mt-4" : "mt-5"} grid gap-2.5`}>
        {artists.map((artist) => {
          const count = counts[artist] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return (
            <div key={artist} className="rounded-xl border border-white/10 bg-[#0c142a] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{artist}</p>
                  <p className="text-xs text-slate-400">
                    {count} {copy.votes}
                  </p>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleVote(artist)}
                  className="shrink-0 rounded-lg bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Voting..." : copy.vote}
                </button>
              </div>
              <progress
                className="mt-3 h-2 w-full appearance-none overflow-hidden rounded-full bg-white/10 [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:bg-fuchsia-400 [&::-moz-progress-bar]:bg-fuchsia-400"
                value={pct}
                max={100}
              />
            </div>
          );
        })}
      </div>

      {success ? <p className="mt-3 text-xs text-emerald-300">{success}</p> : null}
      {error ? <p className="mt-3 text-xs text-amber-300">{error}</p> : null}
    </section>
  );
}
