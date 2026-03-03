"use client";

type Props = {
  eventTitle: string;
  eventTicketUrl?: string | null;
  eventbriteEventId?: string | null;
};

function getProviderCheckoutUrl(
  provider: string,
  globalWidgetUrl: string | undefined,
  eventTicketUrl?: string | null,
  eventbriteEventId?: string | null,
) {
  if (eventTicketUrl) return eventTicketUrl;

  if (provider === "eventbrite" && eventbriteEventId) {
    return `https://www.eventbrite.com/e/${eventbriteEventId}`;
  }

  return globalWidgetUrl;
}

export default function TicketWidget({ eventTitle, eventTicketUrl, eventbriteEventId }: Props) {
  const provider = process.env.NEXT_PUBLIC_TICKETING_PROVIDER ?? "tickettailor";
  const widgetUrl = process.env.NEXT_PUBLIC_TICKETING_WIDGET_URL;

  const checkoutUrl = getProviderCheckoutUrl(provider, widgetUrl, eventTicketUrl, eventbriteEventId);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0c142a] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">Ticket Checkout</h3>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
          {provider}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{eventTitle}</p>
      <div className="mt-4">
        {checkoutUrl ? (
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
          >
            Buy Tickets
          </a>
        ) : (
          <p className="text-sm text-amber-300">
            Missing ticket URL. Add <code>NEXT_PUBLIC_TICKETING_WIDGET_URL</code> or set <code>events.ticket_url</code>.
          </p>
        )}
      </div>
    </section>
  );
}
