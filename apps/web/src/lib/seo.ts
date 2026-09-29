import type { Metadata } from "next";

export const SEO = {
  siteName: "QueenCity Soundboard",
  legalBusinessName: "QueenCity Soundboard",
  baseUrl: "https://queencitysoundboard.com",
  ogImage: "/og-image.png?v=2",
  defaultTitle: "Sounds of the Queen City | QueenCity Soundboard",
  defaultDescription: "Discover live music, concerts, comedy, and cultural events across Cincinnati and Northern Kentucky. Find local picks and official ticket links for your next night out.",
  defaultKeywords: [
    "live music Cincinnati",
    "Cincinnati concerts",
    "concerts Covington",
    "country shows Cincinnati",
    "alternative music Northern Kentucky",
    "what's on in Cincinnati this weekend",
    "Queen City live music",
    "Covington KY events",
    "all-genre events Cincinnati",
    "QueenCity Soundboard",
  ],
  serviceAreas: [
    { name: "Cincinnati, Ohio", type: "City" },
    { name: "Covington, Kentucky", type: "City" },
    { name: "Newport, Kentucky", type: "City" },
    { name: "Northern Kentucky", type: "AdministrativeArea" },
    { name: "Greater Cincinnati", type: "AdministrativeArea" },
  ],
  contactEmail: "event@queencitysoundboard.com",
};

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const canonical = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = `${SEO.baseUrl}${canonical}`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords ?? SEO.defaultKeywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SEO.siteName,
      type: "website",
      images: [
        {
          url: SEO.ogImage,
          width: 1200,
          height: 630,
          alt: SEO.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [SEO.ogImage],
    },
  };
}

/** Breadcrumbs give search and answer engines the page's place in the site hierarchy. */
export function buildBreadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${SEO.baseUrl}${entry.path.startsWith("/") ? entry.path : `/${entry.path}`}`,
    })),
  };
}
