/**
 * Paid placement pricing (case study #15). Change prices here only; /partners, the request
 * form labels and the sponsored slots all read from this file.
 *
 * Easy-entry, flat, low fee to build traction. No live checkout yet: a pay button appears on
 * /partners only when NEXT_PUBLIC_PLACEMENT_PAYMENT_URL (a Stripe Payment Link) is set.
 */
export const PLACEMENT_CONTACT_EMAIL = "event@queencitysoundboard.com";

export const FEATURED_EVENT_PLACEMENT = {
  /** promotion_requests.package value (existing DB check constraint). */
  package: "featured_week",
  name: "Featured Event",
  priceUsd: 25,
  period: "week",
  days: 7,
  /** Sponsored slots shown at once on home and the calendar. */
  maxActive: 3,
} as const;

export function formatPlacementPrice(placement = FEATURED_EVENT_PLACEMENT): string {
  return `$${placement.priceUsd} / ${placement.period}`;
}

/** Stripe Payment Link (or any https checkout URL); null hides the pay button. */
export function placementPaymentUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_PLACEMENT_PAYMENT_URL?.trim();
  if (!value) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}
