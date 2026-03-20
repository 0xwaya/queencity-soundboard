"use client";

type Props = {
  eventTitle: string;
  eventTicketUrl?: string | null;
};

export default function TicketWidget({ eventTitle, eventTicketUrl }: Props) {
  const provider = "tickettailor";
  const widgetUrl = process.env.NEXT_PUBLIC_TICKETING_WIDGET_URL;
  const checkoutUrl = eventTicketUrl || widgetUrl;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0c142a] p-4 shadow-[0_0_30px_rgba(88,28,135,0.12)] transition hover:border-fuchsia-400/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">Ticket Checkout</h3>
        <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">
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
            className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:from-fuchsia-400 hover:via-purple-400 hover:to-cyan-300"
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
