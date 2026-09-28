import type { Metadata } from "next";
import TrackedLink from "@/components/tracked-link";
import { safeJsonLd } from "@/lib/json-ld";
import SkylineBackdrop from "@/components/skyline-backdrop";
import { buildPageMetadata, SEO } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Cincinnati Live Music, Comedy, and Culture",
  description:
    "Discover the hottest Cincinnati events across every genre — live music, comedy, and culture — from QueenCity Soundboard.",
  path: "/cincinnati",
  keywords: [
    "Cincinnati events",
    "Cincinnati live music",
    "Cincinnati nightlife events",
    "QueenCity Soundboard Cincinnati",
  ],
});

export default function CincinnatiPage() {
  const localJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sounds of the Queen City: Cincinnati Live Music and Events",
    url: `${SEO.baseUrl}/cincinnati`,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SEO.baseUrl}/#website`,
    },
    about: {
      "@type": "City",
      name: "Cincinnati",
      containedInPlace: { "@type": "State", name: "Ohio" },
    },
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(localJsonLd) }}
      />

      <section className="qcs-ambient-card relative overflow-hidden rounded-3xl p-7 md:p-10">
        <SkylineBackdrop variant="cincinnati" opacity={50} />
        <div className="qcs-card-content max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">City Guide</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
            Cincinnati&apos;s Hottest Events, Every Genre
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-200 md:text-base">
            QueenCity Soundboard tracks the shows Cincinnati is actually talking about — live music, comedy, and
            cultural events across every neighborhood, curated and cross-checked, not just another calendar dump.
          </p>
        </div>
      </section>

      <section className="qcs-ambient-card rounded-3xl p-6 md:p-8">
        <div className="qcs-card-content">
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Where Cincinnati Fans Start</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
            Use these pages to find active dates, venue details, and direct ticket flow for Greater Cincinnati events.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <TrackedLink
              href="/events"
              event="cta_click"
              label="cincinnati_view_events"
              className="qcs-button-3d rounded-lg bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-400"
            >
              Browse Events
            </TrackedLink>
            <TrackedLink
              href="/partners"
              event="cta_click"
              label="cincinnati_partner"
              className="rounded-lg border border-white/20 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
            >
              Submit an Event
            </TrackedLink>
            <TrackedLink
              href="/covington"
              event="cta_click"
              label="cincinnati_view_covington_hub"
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            >
              Explore Covington Hub
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  );
}