"use client";

import { track } from "@vercel/analytics";
import { readClientSource } from "@/lib/click-source";

type Props = {
  href: string;
  eventId: string;
  eventTitle: string;
  dateLabel: string;
};

/** Mobile-only Buy bar pinned to the bottom of an event page; most TikTok traffic is on phones. */
export default function StickyBuyBar({ href, eventId, eventTitle, dateLabel }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b1020]/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{eventTitle}</p>
          <p className="truncate text-xs text-slate-300">{dateLabel}</p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="sponsored noreferrer noopener"
          onClick={() => track("ticket_click", { event_id: eventId, placement: "sticky", source: readClientSource() })}
          className="qcs-button-3d shrink-0 rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-fuchsia-400"
        >
          Buy tickets
        </a>
      </div>
    </div>
  );
}
