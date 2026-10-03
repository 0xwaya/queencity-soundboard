"use client";

import { track } from "@vercel/analytics";
import { buildAffiliateUrl, resolveAffiliateProvider } from "@/lib/affiliate";

type Props = {
  eventTitle: string;
  eventTicketUrl?: string | null;
  eventId?: string;
  surface?: string;
  locale?: "en" | "es";
  salesDisabled?: boolean;
  salesDisabledReason?: "paused" | "date-tbd";
};

export default function TicketWidget({
  eventTitle,
  eventTicketUrl,
  eventId,
  surface = "calendar",
  locale = "en",
  salesDisabled = false,
  salesDisabledReason = "paused",
}: Props) {
  const provider = "external tickets";
  const ticketProvider = eventTicketUrl ? resolveAffiliateProvider(eventTicketUrl) : null;
  const checkoutUrl = salesDisabled ? null : buildAffiliateUrl(eventTicketUrl, eventId);
  const copy =
    locale === "es"
      ? {
          title: "Checkout de entradas",
          cta: "Comprar entradas",
          missing: "El enlace afiliado de entradas todavía no está disponible.",
          disabled:
            salesDisabledReason === "date-tbd"
              ? "Entradas disponibles cuando se confirme la fecha."
              : "Venta de entradas pausada para este concierto.",
        }
      : {
          title: "Ticket Checkout",
          cta: "Buy Tickets",
          missing: "Affiliate ticket link is not available yet.",
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
            rel="sponsored noreferrer noopener"
            onClick={() => track("ticket_click", {
              event_id: eventId ?? null,
              provider: ticketProvider,
              affiliate_provider: resolveAffiliateProvider(checkoutUrl) ?? ticketProvider,
              surface,
            })}
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
      {checkoutUrl ? (
        <p className="mt-3 text-xs leading-5 text-slate-400">
          {locale === "es"
            ? "Podemos recibir una comision por estos enlaces, sin costo adicional para ti."
            : "We may earn a commission from these links, at no extra cost to you."}
        </p>
      ) : null}
    </section>
  );
}
