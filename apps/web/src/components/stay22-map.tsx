import { buildStay22MapUrl } from "@/lib/stay22";
import type { EventItem } from "@/lib/supabase";

/** Hotels near big venues (case study #17). Renders nothing unless NEXT_PUBLIC_STAY22_AID is set. */
export default function Stay22Map({ event }: { event: EventItem }) {
  const src = buildStay22MapUrl(event);
  if (!src) return null;
  return (
    <section className="space-y-3" aria-labelledby="stay22-heading">
      <h2 id="stay22-heading" className="text-xl font-extrabold tracking-tight text-white">
        Staying the night? Hotels near {event.venues?.name}
      </h2>
      <iframe
        src={src}
        title={`Hotels near ${event.venues?.name ?? "the venue"}`}
        loading="lazy"
        className="h-[380px] w-full rounded-2xl border border-white/10"
      />
      <p className="text-[11px] text-slate-400">Hotel map by Stay22. We may earn a commission on bookings.</p>
    </section>
  );
}
