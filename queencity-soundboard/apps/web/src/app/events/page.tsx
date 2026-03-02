import TicketWidget from "@/components/ticket-widget";
import { getPublishedEvents } from "@/lib/data";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Events</h1>
      {events.length === 0 ? (
        <div className="rounded-xl border bg-white p-6">
          <p className="text-gray-600">No published events yet. Add and publish from admin.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <article key={event.id} className="space-y-4 rounded-xl border bg-white p-5">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="text-sm text-gray-600">{event.artist_name}</p>
              <p className="text-sm">{new Date(event.event_date).toLocaleString()}</p>
              {event.description ? <p className="text-sm text-gray-700">{event.description}</p> : null}
              <TicketWidget eventTitle={event.title} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
