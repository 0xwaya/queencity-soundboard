import type { MetadataRoute } from "next";
import { SEO } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SEO.baseUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SEO.baseUrl}/events`,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SEO.baseUrl}/cincinnati`,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${SEO.baseUrl}/covington`,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${SEO.baseUrl}/partners`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SEO.baseUrl}/merch`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SEO.baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
