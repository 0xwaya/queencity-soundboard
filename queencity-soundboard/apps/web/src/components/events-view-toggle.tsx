"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";

type Props = {
  view: "spotlight" | "compact";
};

export default function EventsViewToggle({ view }: Props) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <Link
        href="/events?view=spotlight"
        onClick={() => track("events_view_toggle", { view: "spotlight" })}
        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
          view === "spotlight"
            ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30"
        }`}
      >
        Spotlight
      </Link>
      <Link
        href="/events?view=compact"
        onClick={() => track("events_view_toggle", { view: "compact" })}
        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
          view === "compact"
            ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200"
            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30"
        }`}
      >
        Compact
      </Link>
    </div>
  );
}
