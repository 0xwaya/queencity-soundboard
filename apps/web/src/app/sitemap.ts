import type { MetadataRoute } from "next";
import { getPublishedEvents } from "@/lib/data";
import { SEO } from "@/lib/seo";

// Event URLs change as shows are synced; rebuild the sitemap hourly.
export const revalidate = 3600;

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${SEO.baseUrl}/`, changeFrequency: "daily", priority: 1 },
  { url: `${SEO.baseUrl}/events`, changeFrequency: "daily", priority: 0.95 },
  { url: `${SEO.baseUrl}/tonight`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SEO.baseUrl}/cincinnati`, changeFrequency: "weekly", priority: 0.88 },
  { url: `${SEO.baseUrl}/covington`, changeFrequency: "weekly", priority: 0.88 },
  { url: `${SEO.baseUrl}/partners`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SEO.baseUrl}/merch`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${SEO.baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: events } = await getPublishedEvents();
  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${SEO.baseUrl}/events/${event.id}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  return [...STATIC_PAGES, ...eventPages];
}
