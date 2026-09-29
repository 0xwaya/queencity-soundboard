import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "@/components/header";
import { getLocale } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import { SEO } from "@/lib/seo";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO.baseUrl),
  title: {
    default: SEO.defaultTitle,
    template: `%s | ${SEO.siteName}`,
  },
  description: SEO.defaultDescription,
  applicationName: SEO.siteName,
  keywords: SEO.defaultKeywords,
  category: "events",
  authors: [{ name: SEO.siteName }],
  openGraph: {
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    url: SEO.baseUrl,
    siteName: SEO.siteName,
    images: [
      {
        url: SEO.ogImage,
        width: 1200,
        height: 630,
        alt: SEO.siteName,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    images: [SEO.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/qcs-logo-animated.gif",
  },
  other: {
    "geo.region": "US-OH",
    "geo.placename": "Cincinnati",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const footerTagline =
    locale === "es"
      ? "Noches con cultura. Entradas listas. Al máximo nivel."
      : "Culture-forward nights. Ticketed. Elevated.";
  const footerCredit =
    locale === "es"
      ? "Construido por"
      : "Built by";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SEO.baseUrl}/#organization`,
    name: SEO.legalBusinessName,
    alternateName: SEO.siteName,
    description: SEO.defaultDescription,
    url: SEO.baseUrl,
    email: SEO.contactEmail,
    image: `${SEO.baseUrl}${SEO.ogImage}`,
    logo: {
      "@type": "ImageObject",
      url: `${SEO.baseUrl}/qcs-logo.png`,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SEO.contactEmail,
        areaServed: "US",
        availableLanguage: ["English", "Spanish"],
      },
    ],
    areaServed: SEO.serviceAreas.map((area) => ({ "@type": area.type, name: area.name })),
    knowsAbout: [
      "Cincinnati live music",
      "Northern Kentucky concerts",
      "Covington events",
      "comedy shows Cincinnati",
      "local event tickets",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO.baseUrl}/#website`,
    name: SEO.siteName,
    url: SEO.baseUrl,
    description: SEO.defaultDescription,
    publisher: { "@id": `${SEO.baseUrl}/#organization` },
    inLanguage: "en",
  };

  return (
    <html lang={locale === "es" ? "es" : "en"}>
      <body className={`${bebasNeue.variable} bg-[#07090f] text-slate-100 antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }}
        />
        <Header locale={locale} />
        <main className="qcs-shell py-10">{children}</main>
        <Analytics />
        <footer className="border-t border-white/10 bg-[#0b1020]">
          <div className="qcs-shell flex flex-col gap-4 py-8 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-100">QueenCity Soundboard</p>
              <p className="truncate text-xs text-slate-400 max-w-xs sm:max-w-none">{footerTagline}</p>
              <p className="text-[11px] text-slate-500">
                © {new Date().getFullYear()} QueenCity Soundboard. {footerCredit} {" "}
                <span className="wayalabs-word text-slate-200">wayalabs</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Socials</p>
                <div className="flex items-center gap-3">
                  <a
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Instagram"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                    href="https://www.tiktok.com/"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="TikTok"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 4c.6 2.4 2.5 4.3 4.8 4.8V11c-1.9-.1-3.5-.8-4.8-2v6.1c0 2.7-2.2 4.9-4.9 4.9S4.2 17.8 4.2 15.1c0-2.6 2.1-4.8 4.8-4.9v2.5c-1.2.1-2.2 1.1-2.2 2.4 0 1.4 1.1 2.4 2.4 2.4 1.3 0 2.4-1.1 2.4-2.4V4h2.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-white/30 hover:text-white"
                    href="https://x.com/"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="X"
                  >
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 4h3.7l4.1 5.6L17.6 4H21l-6.3 8.6L21.4 20H17.8l-4.6-6.2L8.1 20H4.7l6.7-9.2L5 4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
