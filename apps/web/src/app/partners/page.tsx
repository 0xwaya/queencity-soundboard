import type { Metadata } from "next";
import EventSubmitForm from "@/components/event-submit-form";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Partner With QueenCity Soundboard",
  description:
    "Submit an event, pitch a venue spotlight, or become a partner with QueenCity Soundboard — Cincinnati and Northern Kentucky's events discovery hub.",
  path: "/partners",
  keywords: ["submit an event Cincinnati", "promote event Cincinnati", "venue partnership Cincinnati"],
});

export default function PartnersPage() {
  return (
    <div className="space-y-7">
      <section className="qcs-ambient-card rounded-3xl p-6 md:p-10">
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
