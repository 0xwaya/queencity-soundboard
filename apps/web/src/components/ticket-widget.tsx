"use client";

import { track } from "@vercel/analytics";
import { normalizeHttpsUrl } from "@/lib/url";

type Props = {
  eventTitle: string;
  eventTicketUrl?: string | null;
  locale?: "en" | "es-ve";
  salesDisabled?: boolean;
  salesDisabledReason?: "paused" | "date-tbd";
};

export default function TicketWidget({
  eventTitle,
  eventTicketUrl,
  locale = "en",
  salesDisabled = false,
  salesDisabledReason = "paused",
}: Props) {
  const provider = "external tickets";
  const checkoutUrl = salesDisabled ? null : normalizeHttpsUrl(eventTicketUrl);
  const copy =
    locale === "es-ve"
      ? {
          title: "Checkout de entradas",
          cta: "Comprar entradas",
          missing: "El enlace oficial de entradas todavía no está disponible.",
          disabled:
            salesDisabledReason === "date-tbd"
              ? "Entradas disponibles cuando se confirme la fecha."
              : "Venta de entradas pausada para este concierto.",
        }
      : {
          title: "Ticket Checkout",
          cta: "Buy Tickets",
          missing: "Official ticket link is not available yet.",
          disabled:
            salesDisabledReason === "date-tbd"
              ? "Tickets will open when the date is confirmed."
              : "Ticket sales are paused for this concert.",
        };

  return (
    <section className="rounded-xl border border-white/10 bg-[#0c142a] p-4 shadow-[0_0_30px_rgba(88,28,135,0.12)] transition hover:border-fuchsia-400/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100">{copy.title}</h3>
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
            rel="noreferrer noopener"
            onClick={() => track("checkout_click", { title: eventTitle, url: checkoutUrl, provider })}
            className="qcs-button-3d inline-flex w-full items-center justify-center rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400"
          >
            {copy.cta}
          </a>
        ) : salesDisabled ? (
          <p className="text-sm text-amber-300">{copy.disabled}</p>
        ) : (
          <p className="text-sm text-amber-300">{copy.missing}</p>
        )}
      </div>
    </section>
  );
}
