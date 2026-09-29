# Frontend Status and Path to Full Functionality

**Status date:** 2026-09-26

## What the frontend is

QueenCity Soundboard is a multi-genre local discovery surface for Cincinnati and Northern Kentucky. It brings locally curated event listings, venue context, official ticket destinations, and community/partner intake together. It is not an in-house ticket marketplace, and purchase completion happens on the external provider's site.

## Visitor-facing walkthrough

1. **Home:** establishes the “Sounds of the Queen City” position, surfaces genre breadth, offers event and partner calls to action, and selects a Ticket Spotlight from upcoming published events that have a ticket URL. If there is no qualifying event, it routes visitors to the calendar. The homepage displays a possible-commission disclosure.
2. **Events:** loads published Supabase events; orders promoted rows first and then by date; derives category filters from available inventory; supports Spotlight and Compact views; and renders event, venue, artist, date, description, and ticket details.
3. **City pages:** Cincinnati and Covington hubs provide local SEO/discovery entry points and links back into the shared calendar.
4. **About:** describes local curation and the external-ticket handoff.
5. **Partners:** accepts event submissions through a validated API route and stores them as pending rows in `event_submissions`. Success means received for review, not publicly approved.
6. **Merch:** displays active catalog items. Product fulfillment and a complete purchase flow are not established by the browse page alone.
7. **Navigation/localization:** responsive primary navigation and an EN/ES toggle exist. Spanish localization is partial; verify each visitor-critical route before marketing the site as fully bilingual.

## Current data and integration path

- Browser-facing event and merch reads use the Supabase URL and anon key.
- Event submissions go through `/api/events/submit` and the server-side Supabase client.
- Public event listings are filtered to `status = published`; staff-only event/submission access is intended to be guarded by database policies and `public.is_admin()`.
- Ticket URLs are normalized to safe HTTPS destinations. Ticket buttons require per-event URLs; the legacy global Ticket Tailor fallback is no longer read by the app.
- Vercel Analytics is active for page traffic and click events. Click measurement does not itself create affiliate attribution or a commission agreement.
- Production Supabase was reachable on 2026-09-26; a read-only query returned 5 published events. Confirm feed freshness, dates, ticket links, and venue quality separately.
- Ticketmaster sync runs through a deployed Supabase Edge Function on a twice-daily schedule; monitor cron responses and sync logs to confirm ongoing health. Madison Theater sync is deprecated and out of scope; its former endpoint returns HTTP 410.
- Ticket CTAs require an event-specific HTTPS destination and a configured provider affiliate template. The affiliate URL builder fails closed rather than silently sending untracked direct links. Configure only templates for approved programs, then verify the corresponding production environment variables.

## Known gaps before calling it fully functional

### P0 — Correctness and trust

- Apply the generated category-constraint migration after checking Production's migration history. Frontend/API validation already uses one shared allowlist; the existing database constraint must be widened before these new values can be published into `events`.
- Add explicit empty, loading, stale-data, and query-error states wherever a visitor currently sees an empty list or fallback.
- Audit current published records for multi-genre and Cincinnati/NKY coverage, correct time zone, duplicate rows, active ticket sales, and working provider URLs.

### P1 — Editorial operations

- Build a protected staff moderation experience for pending submissions: review, edit, approve, reject, publish, and archive.
- Support venue management, event date/time zones, category validation, image moderation, and duplicate detection.
- Add freshness rules and a reliable process for expired/cancelled events.
- Operationalize official-source ingestion and monitoring. Keep human review for imports and preserve source attribution.

### P2 — Revenue and community

- Confirm production affiliate partners and attribution parameters per provider; disclose affiliate links beside each monetized CTA and measure provider-specific outbound conversions where possible. Do not describe unconfigured ticket destinations as monetized.
- Establish paid-placement labeling and partner terms before accepting featured-placement revenue.
- Add consent-based email signup, confirmed/unsubscribe flows, and the weekly Queen City Picks digest.
- Define merch fulfillment/support or keep the section informational until operations are ready.
- Consider memberships or co-promotes only after visitor demand, partner conversion, and operating costs are measurable.

## Suggested delivery order and acceptance checks

1. **Verify production baseline:** inspect migration history, data quality, Vercel env targets, sync logs, and live ticket destinations. Do not reveal secret values in logs or reports.
2. **Close state gaps:** test no-event, no-ticket, query-failure, sold-out/cancelled, and expired-event behavior. Stale Fan Signal copy has been removed from global metadata.
3. **Ship staff moderation:** an authorized operator can process a submission without direct SQL; unauthenticated users cannot read or alter the queue.
4. **Stabilize the calendar supply:** ingest/curate a diverse set of official listings, monitor sync failures, and retire stale entries.
5. **Launch measurable partnerships:** add approved affiliate tracking and placement disclosures, then review click-through and revenue against fixed costs.
6. **Build retention after consent:** email signup and weekly digest, with unsubscribe and data-retention behavior tested end to end.

Completed 2026-09-26: event cards no longer inherit a shared checkout URL. A regression test covers the case where the legacy global URL is configured but the event has no ticket link. Site-wide SEO metadata no longer claims that the homepage includes Fan Signal voting. The event category allowlist is shared by the submission UI/API; its database constraint migration is generated but not yet applied.

## Release checks

Run from `apps/web`:

```bash
npm run lint
npm run test:run
npm run build
```

At the status date, the production build and 9 existing tests passed. Whole-app lint reports two existing `no-explicit-any` errors in `src/lib/votes-store.ts`; targeted lint of the recently changed public pages passed. Re-run checks against the current branch before each release.
