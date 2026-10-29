import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import EventsListing, { categoryPath } from "@/components/events-listing";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Upcoming Events in Cincinnati & Northern Kentucky",
  description:
    "Browse the hottest upcoming events across Cincinnati and Northern Kentucky — live music, comedy, and culture in every genre.",
  path: "/events",
  keywords: [
    "upcoming concerts Cincinnati",
    "things to do Cincinnati",
    "Northern Kentucky events",
    "live music calendar Cincinnati",
  ],
});

type EventsPageProps = {
  searchParams?: Promise<{ view?: string; category?: string; page?: string }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = (await searchParams) ?? {};
  // Old ?category= links move to the indexable category URL (case study #12).
  if (params.category) permanentRedirect(categoryPath(params.category));
  return <EventsListing page={params.page} view={params.view} />;
}
