import type { Metadata } from "next";
import EventSubmitForm from "@/components/event-submit-form";
import PromotionRequestForm from "@/components/promotion-request-form";
import SkylineBackdrop from "@/components/skyline-backdrop";
import { buildPageMetadata } from "@/lib/seo";
import { FEATURED_EVENT_PLACEMENT, PLACEMENT_CONTACT_EMAIL, formatPlacementPrice, placementPaymentUrl } from "@/lib/placements";

// Cached and refreshed in the background (case study #11).
export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "Partner With Us",
  description:
    "Submit an event, pitch a venue spotlight, or become a partner with QueenCity Soundboard — Cincinnati and Northern Kentucky's events discovery hub.",
  path: "/partners",
  keywords: ["submit an event Cincinnati", "promote event Cincinnati", "venue partnership Cincinnati"],
});

export default function PartnersPage() {
  const paymentUrl = placementPaymentUrl();
  return (
    <div className="space-y-7">
      <section className="qcs-ambient-card relative overflow-hidden rounded-3xl p-6 md:p-10">
        <SkylineBackdrop opacity={40} />
        <div className="qcs-card-content max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">Partner with us</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">
            Put your next show on Cincinnati&apos;s soundboard.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
            Venue, promoter, or artist? Submit any genre of event for review and we&apos;ll add it to the local calendar.
            Feature your show, pitch a Venue Spotlight, or ask about sponsorships. Tell us in the description field or email us directly
            at{" "}
            <a className="text-cyan-200 hover:text-cyan-100" href="mailto:event@queencitysoundboard.com">
              event@queencitysoundboard.com
            </a>
            .
          </p>
        </div>
      </section>

      <section className="qcs-ambient-card rounded-3xl p-6 md:p-8">
        <div className="qcs-card-content">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">Paid placement</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white md:text-2xl">Promote your show</h2>
          <p className="mt-2 text-sm text-slate-300">
            Regular calendar listings stay free. A paid slot puts your show in front of Cincinnati and Northern Kentucky
            fans looking for something to do this week.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-500/5 p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-lg font-bold text-white">{FEATURED_EVENT_PLACEMENT.name}</h3>
              <p className="text-3xl font-extrabold text-amber-200">
                ${FEATURED_EVENT_PLACEMENT.priceUsd}
                <span className="text-sm font-semibold text-slate-300"> / {FEATURED_EVENT_PLACEMENT.period}</span>
              </p>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-200">
              <li>A sponsored slot on the homepage and at the top of the events calendar for {FEATURED_EVENT_PLACEMENT.days} days.</li>
              <li>Clearly labeled &ldquo;Sponsored&rdquo;, linked to your event page and tickets.</li>
              <li>Only {FEATURED_EVENT_PLACEMENT.maxActive} sponsored events at a time, so yours stands out.</li>
              <li>Ends automatically when your week is up. No contract, no auto-renew.</li>
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {paymentUrl ? (
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qcs-button-3d rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-bold text-[#15120a] hover:bg-amber-200"
                >
                  Pay {formatPlacementPrice()}
                </a>
              ) : null}
              <p className="text-xs text-slate-300">
                {paymentUrl
                  ? "Send the form below too so we know which event and week to feature."
                  : "Send the form below. "}
                {paymentUrl ? null : (
                  <>
                    We&apos;ll follow up by email at{" "}
                    <a className="text-cyan-200 hover:text-cyan-100" href={`mailto:${PLACEMENT_CONTACT_EMAIL}`}>
                      {PLACEMENT_CONTACT_EMAIL}
                    </a>{" "}
                    to confirm your week and payment.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <PromotionRequestForm />
          </div>
        </div>
      </section>

      <section className="qcs-ambient-card rounded-3xl p-6 md:p-8">
        <div className="qcs-card-content">
          <h2 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">Submit an event</h2>
          <p className="mt-2 text-sm text-slate-300">
            Submissions are reviewed before appearing on the public calendar.
          </p>
          <div className="mt-6">
            <EventSubmitForm />
          </div>
        </div>
      </section>
    </div>
  );
}
