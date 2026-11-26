import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import EventsListing, { categoryPath, EVENTS_PAGE_SIZE } from "@/components/events-listing";
import { getPublishedEvents } from "@/lib/data";
import { normalizeEventsPage } from "@/lib/events-pagination";
import { buildPageMetadata } from "@/lib/seo";

type EventsPageProps = {
  searchParams?: Promise<{ view?: string; category?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const { data } = await getPublishedEvents();
  const pageCount = Math.max(1, Math.ceil(data.length / EVENTS_PAGE_SIZE));
  const page = normalizeEventsPage(params.page, pageCount);
  return buildPageMetadata({
    title: "Upcoming Events in Cincinnati & Northern Kentucky",
    description:
      "Browse the hottest upcoming events across Cincinnati and Northern Kentucky — live music, comedy, and culture in every genre.",
    path: page > 1 ? `/events?page=${page}` : "/events",
    keywords: [
      "upcoming concerts Cincinnati",
      "things to do Cincinnati",
      "Northern Kentucky events",
      "live music calendar Cincinnati",
    ],
  });
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = (await searchParams) ?? {};
  // Old ?category= links move to the indexable category URL (case study #12).
  if (params.category) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page);
    if (params.view) query.set("view", params.view);
    const suffix = query.toString();
    permanentRedirect(`${categoryPath(params.category)}${suffix ? `?${suffix}` : ""}`);
  }
  return <EventsListing page={params.page} view={params.view} />;
}
