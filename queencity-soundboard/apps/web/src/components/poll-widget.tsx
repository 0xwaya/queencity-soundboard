"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const ARTISTS = [
  "Franco De Vita",
  "Ilan Chester",
  "Maria Teresa Chacín",
  "Guillermo Dávila",
];

type VoteCounts = Record<string, number>;

export default function PollWidget() {
  const [counts, setCounts] = useState<VoteCounts>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const totalVotes = useMemo(() => Object.values(counts).reduce((sum, val) => sum + val, 0), [counts]);

  const loadVotes = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: fetchError } = await supabase
        .from("artist_votes")
        .select("artist_name");

      if (fetchError) throw fetchError;

      const nextCounts: VoteCounts = {};
      ARTISTS.forEach((artist) => (nextCounts[artist] = 0));
      (data ?? []).forEach((row: { artist_name: string }) => {
        if (nextCounts[row.artist_name] !== undefined) {
          nextCounts[row.artist_name] += 1;
        }
      });
      setCounts(nextCounts);
    } catch (err) {
      setError("Unable to load votes yet.");
    }
  };

  const handleVote = async (artist: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: insertError } = await supabase
        .from("artist_votes")
        .insert({ artist_name: artist });

      if (insertError) throw insertError;
      setVoted(true);
      await loadVotes();
    } catch (err) {
      setError("Vote failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVotes();
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1228] p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">Fan Vote</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white md:text-3xl">Who should we book next?</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Vote for the artist you want to see live. We’ll use this signal to lock in the next showcase.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0e1732] px-4 py-3 text-xs text-slate-300">
          <p className="font-semibold text-slate-200">Live tally</p>
          <p>{totalVotes} total votes</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {ARTISTS.map((artist) => {
          const count = counts[artist] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return (
            <div key={artist} className="rounded-2xl border border-white/10 bg-[#0c142a] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{artist}</p>
                  <p className="text-xs text-slate-400">{count} votes</p>
                </div>
                <button
                  disabled={loading || voted}
                  onClick={() => handleVote(artist)}
                  className="rounded-lg bg-fuchsia-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {voted ? "Thanks for voting" : "Vote"}
                </button>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-fuchsia-400" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-xs text-amber-300">{error}</p> : null}
    </section>
  );
}
