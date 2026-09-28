"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EventItem } from "@/lib/supabase";

type Props = {
  events: EventItem[];
};

/** Rotates promoted/upcoming events across every genre, not just one category. */
export default function FeaturedEventsWidget({ events }: Props) {
  const featured = events.filter((event) => event.is_promoted).slice(0, 5);
  const rotation = featured.length > 0 ? featured : events.slice(0, 3);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (rotation.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotation.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [rotation.length]);

  const currentEvent = rotation[currentIndex];
  if (!currentEvent) return null;

  return (
    <Link href="/events">
      <div className="group qcs-ambient-card rounded-2xl border border-[#d4b87e]/20 p-6 transition-all hover:border-[#d4b87e]/40 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎵</span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4b87e]">
                {currentEvent.is_promoted
                  ? "Promoted Event"
                  : currentEvent.ticketmaster_relevance_rank != null
                    ? "Ticketmaster relevance"
                    : "Upcoming in Cincinnati + NKY"}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-bold text-[#f5efe1] transition-colors group-hover:text-[#d4b87e]">
              {currentEvent.title}
            </h3>

            {currentEvent.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-slate-300">{currentEvent.description}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {currentEvent.category ? (
                <span className="rounded-full border border-[#d4b87e]/30 bg-[#d4b87e]/10 px-2 py-1 text-xs font-semibold text-[#d4b87e]">
                  {currentEvent.category}
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-1 text-sm">
              {currentEvent.venues?.name ? (
                <p className="text-slate-300">
                  <span className="font-semibold">📍</span> {currentEvent.venues.name}
                  {currentEvent.venues.city ? `, ${currentEvent.venues.city}` : ""}
                </p>
              ) : null}
              <p className="text-slate-300">
                <span className="font-semibold">📅</span> {new Date(currentEvent.event_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div className="flex gap-1">
              {rotation.map((event, idx) => (
                <div
                  key={event.id}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === currentIndex ? "w-4 bg-[#d4b87e]" : "bg-[#d4b87e]/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-slate-400">Browse all events</div>
        </div>
      </div>
    </Link>
  );
}
