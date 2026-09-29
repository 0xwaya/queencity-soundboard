# AI Agent Handoff: Events and Ticket Monetization

Updated: 2026-09-29

## Current State

- Published events are read from Supabase. The deployed `sync-ticketmaster-events` Edge Function imports future, on-sale events within 25 miles of Cincinnati and runs twice daily at 06:15 and 18:15 UTC.
- Madison Theater sync is deprecated and out of scope. Its old endpoint returns HTTP 410; do not reactivate it without confirming its status and current schedule.
- Ticketmaster relevance is an ordering signal, not verified sales or popularity. Keep that distinction clear in UI and copy.
- Home, event-page, and sports ticket CTAs use `apps/web/src/lib/affiliate.ts`. A CTA is shown only when its provider template is configured and produces a safe HTTPS URL; missing affiliate templates do not fall back to direct links.

## Affiliate Setup

- The app supports Ticketmaster, SeatGeek, StubHub, Vivid Seats, AXS, and Eventbrite templates through `NEXT_PUBLIC_AFFILIATE_TEMPLATE_<PROVIDER>`.
- Configure a template only after the publisher is approved by that program. Keep the official event URL as the canonical destination and confirm the generated tracking URL preserves it.
- The Ticketmaster affiliate template is configured, as confirmed by the user and validated locally. Do not report it as missing; focus remaining affiliate onboarding on the other providers and verify actual click attribution during release QA.
- Rows from providers without a configured affiliate template will intentionally have no ticket CTA.

## Hi Energy Investigation

No Hi Energy function or API secret remains in Supabase or the repository. A protected, read-only probe confirmed that the configured API key could call `/api/v1/schema`, `/api/v1/advertisers?domain=axs.com`, and `/api/v1/deals?country=US&active=true&search=ticket` successfully. The US ticket-deal search returned no rows. The AXS lookup returned advertiser records with unknown program status and zero recorded commission in the sampled records.

`POST /api/v1/deeplinks/generate` for `https://axs.com` returned HTTP 403. Do not build or publish AXS affiliate links based only on advertiser lookup results. Revisit only after Hi Energy confirms link generation is enabled for the publisher and the relevant AXS program/network is approved; then test a real event URL and require a successful HTTPS tracking URL before wiring it into QCS.

## Release Checks

From `apps/web`, run `npm run test:run`, `npm run lint`, and `npm run build`. Verify Supabase cron responses, current event freshness, ticket destinations, and affiliate templates in Production before making go-live claims.
