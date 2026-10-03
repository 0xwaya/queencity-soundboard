import type { Metadata } from "next";
import EventSubmitForm from "@/components/event-submit-form";
import PromotionRequestForm from "@/components/promotion-request-form";
import SkylineBackdrop from "@/components/skyline-backdrop";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Partner With Us",
  description:
    "Submit an event, pitch a venue spotlight, or become a partner with QueenCity Soundboard — Cincinnati and Northern Kentucky's events discovery hub.",
  path: "/partners",
  keywords: ["submit an event Cincinnati", "promote event Cincinnati", "venue partnership Cincinnati"],
});

export default function PartnersPage() {
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

      <section className="py-6 md:py-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">Paid placement</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white md:text-2xl">Promote your show</h2>
          <p className="mt-2 text-sm text-slate-300">
            Reach Cincinnati and Northern Kentucky event audiences with a clearly labeled sponsored placement.
            Standard calendar listings remain free and chronological.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="min-w-0 border-l-2 border-amber-300/60 pl-5">
              <h3 className="text-lg font-bold text-white">Sponsored event spotlight</h3>
              <p className="mt-2 text-xl font-semibold text-amber-200">$49-$99 <span className="text-sm font-normal text-slate-300">/ 7-day pilot</span></p>
              <p className="mt-3 text-sm leading-6 text-slate-300">A sponsored slot on the homepage and calendar, linked to your event, with a visibility and click report. Up to three active sponsored events at a time.</p>
            </div>
            <div className="min-w-0 border-l-2 border-cyan-300/60 pl-5">
              <h3 className="text-lg font-bold text-white">Venue campaign</h3>
              <p className="mt-2 text-xl font-semibold text-cyan-200">$149-$249 <span className="text-sm font-normal text-slate-300">/ 30-day pilot quote</span></p>
              <p className="mt-3 text-sm leading-6 text-slate-300">A custom campaign for your venue&apos;s upcoming shows. Placement inventory and deliverables are agreed before payment.</p>
            </div>
          </div>
          <p className="mt-6 text-xs leading-6 text-slate-400">
            Pilot pricing is subject to availability and a written quote. Approval, dates, cancellation and refund terms
            are confirmed before invoicing. Placements do not guarantee clicks, bookings or ticket sales.
          </p>
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
