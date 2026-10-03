"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { track } from "@vercel/analytics";

type Props = {
  event: "event_view" | "sponsored_impression";
  eventId: string;
  surface: string;
  campaignId?: string;
  children: ReactNode;
};

export default function EventEngagement({ event, eventId, surface, campaignId, children }: Props) {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current || typeof IntersectionObserver === "undefined") return;
    const storageKey = `qcs_seen:${event}:${eventId}:${surface}:${campaignId ?? ""}`;
    let recorded = false;
    let inView = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      recorded = sessionStorage.getItem(storageKey) === "1";
    } catch {
      recorded = false;
    }
    if (recorded) return;

    function updateVisibility() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      if (recorded || !inView || document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        recorded = true;
        track(event, { event_id: eventId, surface, campaign_id: campaignId ?? null });
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {
          recorded = true;
        }
      }, 1000);
    }

    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5);
      updateVisibility();
    }, { threshold: [0, 0.5] });
    observer.observe(element.current);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [event, eventId, surface, campaignId]);

  return <div ref={element}>{children}</div>;
}