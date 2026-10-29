import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventsListing, { categoryPath } from "@/components/events-listing";
import { EVENT_CATEGORIES } from "@/lib/event-categories";
import { buildPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ view?: string; page?: string }>;
};

const LABELS: Record<string, string> = {
  hiphop: "Hip-Hop",
  rnb: "R&B",
  edm: "Electronic",
  other: "More",
};

function isCategory(value: string): value is (typeof EVENT_CATEGORIES)[number] {
  return (EVENT_CATEGORIES as readonly string[]).includes(value);
}

function label(category: string): string {
  return LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return { title: "Category not found", robots: { index: false, follow: true } };
  return buildPageMetadata({
    title: `${label(category)} events in Cincinnati & Northern Kentucky`,
    description: `Upcoming ${label(category).toLowerCase()} events in Cincinnati and Northern Kentucky, with dates, venues and official ticket links.`,
    path: categoryPath(category),
    keywords: [`${label(category)} Cincinnati`, `${label(category)} events Cincinnati`, `${label(category)} Northern Kentucky`],
  });
}

/** Indexable category listing, e.g. /events/c/comedy (case study #12). */
export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, query] = await Promise.all([params, searchParams]);
  if (!isCategory(category)) notFound();
  return <EventsListing category={category} page={query?.page} view={query?.view} />;
}
