import type { Metadata } from "next";
import TrackedLink from "@/components/tracked-link";
import { safeJsonLd } from "@/lib/json-ld";
import SkylineBackdrop from "@/components/skyline-backdrop";
import { buildPageMetadata, SEO } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Covington KY Events, Venue Nights, and Tickets",
  description:
    "Find Covington, KY live music nights, venue highlights, and direct ticket links for QueenCity Soundboard experiences.",
  path: "/covington",
  keywords: [
    "Covington KY events",
    "Covington live music",
    "Northern Kentucky events",
    "Northern Kentucky nightlife",
  ],
});

export default function CovingtonPage() {
  const localJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Covington KY Concerts and Venue Nights",
    url: `${SEO.baseUrl}/covington`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SEO.baseUrl}/#website`,
    },
    about: {
      "@type": "City",
      name: "Covington",
      containedInPlace: { "@type": "State", name: "Kentucky" },
    },
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(localJsonLd) }}
      />

      <section className="qcs-ambient-card relative overflow-hidden rounded-3xl p-7 md:p-10">
        <SkylineBackdrop variant="covington" opacity={50} />
        <div className="qcs-card-content max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/85">Local Hub</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Covington, KY Events Across the River
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-200 md:text-base">
            Northern Kentucky&apos;s live music and culture scene, tracked alongside Cincinnati — historic rooms,
            riverfront series, and neighborhood nights, all in one calendar.
          </p>
        </div>
      </section>

      <section className="qcs-ambient-card rounded-3xl p-6 md:p-8">
        <div className="qcs-card-content">
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Plan Your Night in Covington</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
            Start with upcoming shows, then review venue details and routing from both sides of the river.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <TrackedLink
              href="/events"
              event="cta_click"
              label="covington_view_events"
              className="qcs-button-3d rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400"
            >
              View Upcoming Events
            </TrackedLink>
            <TrackedLink
              href="/partners"
              event="cta_click"
              label="covington_partner"
              className="rounded-lg border border-white/20 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Submit an Event
            </TrackedLink>
            <TrackedLink
              href="/cincinnati"
              event="cta_click"
              label="covington_view_cincinnati_hub"
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Explore Cincinnati Hub
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  );
}