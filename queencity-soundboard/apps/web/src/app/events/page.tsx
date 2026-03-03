import TicketWidget from "@/components/ticket-widget";
import { getPublishedEvents } from "@/lib/data";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">Live lineup</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">Events</h1>
        <p className="mt-2 text-sm text-slate-300">Tap any event and complete checkout in a few clicks.</p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-6">
          <p className="text-slate-300">No published events yet. Add and publish from admin.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="space-y-4 rounded-2xl border border-white/10 bg-[#0b1228] p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight text-slate-100">{event.title}</h2>
                <span className="rounded-full border border-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Live
                </span>
              </div>

              <p className="text-sm text-slate-300">{new Date(event.event_date).toLocaleString()}</p>
              {event.venues?.name ? (
                <p className="text-sm text-slate-400">
                  {event.venues.name}
                  {event.venues.city ? ` • ${event.venues.city}${event.venues.state ? `, ${event.venues.state}` : ""}` : ""}
                </p>
              ) : null}
              <p className="text-sm text-slate-400">{event.artist_name}</p>
              {event.description ? <p className="text-sm text-slate-300">{event.description}</p> : null}
              <TicketWidget
                eventTitle={event.title}
                eventTicketUrl={event.ticket_url}
                eventbriteEventId={event.eventbrite_event_id}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
