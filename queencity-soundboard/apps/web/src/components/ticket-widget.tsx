"use client";

import { useMemo } from "react";

type Props = {
  eventTitle: string;
};

export default function TicketWidget({ eventTitle }: Props) {
  const provider = process.env.NEXT_PUBLIC_TICKETING_PROVIDER ?? "ticketspice";
  const widgetUrl = process.env.NEXT_PUBLIC_TICKETING_WIDGET_URL;

  const cta = useMemo(() => {
    if (!widgetUrl) return null;
    return (
      <a
        href={widgetUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Buy Tickets
      </a>
    );
  }, [widgetUrl]);

  return (
    <section className="rounded-xl border p-4">
      <h3 className="text-lg font-semibold">Tickets</h3>
      <p className="mt-1 text-sm text-gray-600">
        Provider: <span className="font-medium uppercase">{provider}</span>
      </p>
      <p className="mt-2 text-sm">Event: {eventTitle}</p>
      <div className="mt-4">
        {cta ?? (
          <p className="text-sm text-red-600">
            Missing NEXT_PUBLIC_TICKETING_WIDGET_URL in environment.
          </p>
        )}
      </div>
    </section>
  );
}
