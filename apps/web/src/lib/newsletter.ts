import { z } from "zod";

/**
 * Case study #14 scaffold: weekly "This week in Cincy" email capture.
 * Off unless NEXT_PUBLIC_NEWSLETTER_ENABLED=true. The only provider wired is beehiiv
 * (BEEHIIV_API_KEY + BEEHIIV_PUBLICATION_ID, server-only); no account exists yet.
 */
export function isNewsletterEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "true";
}

export const newsletterSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  /** Where the form was shown: home, event_page, tonight. */
  placement: z.string().trim().max(40).optional(),
  /** Honeypot: real people leave it empty. */
  company: z.string().max(0).optional().or(z.literal("")),
});

export type NewsletterProvider = { name: "beehiiv"; apiKey: string; publicationId: string };

export function getNewsletterProvider(): NewsletterProvider | null {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!isNewsletterEnabled() || !apiKey || !publicationId) return null;
  return { name: "beehiiv", apiKey, publicationId };
}
