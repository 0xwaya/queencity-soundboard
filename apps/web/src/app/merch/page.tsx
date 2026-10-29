import { notFound } from "next/navigation";

/**
 * Case study #19: no merch yet, so /merch is hidden (404, not in nav, footer, sitemap or llms.txt).
 * The previous catalog page lives in git history (see the commit that added this file) and
 * getMerchItems() in lib/data.ts is kept for when merch launches.
 */
export default function MerchPage() {
  notFound();
}
