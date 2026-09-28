# QueenCity Soundboard — Delivery Plan

## Product decision

QueenCity Soundboard is a local event discovery and community platform for all genres across Cincinnati and Northern Kentucky. It sends visitors to official third-party ticket checkout; it does not sell tickets or process payments itself. Stripe checkout, inventory reservation, and a native mobile app are not current MVP requirements.

The detailed current-state inventory and acceptance criteria are in [Frontend and full-functionality roadmap](docs/FRONTEND_AND_ROADMAP.md).

## Current foundation

- Next.js app deployed through Vercel, rooted at `apps/web`.
- Supabase stores events, venues, merch, and pending event submissions.
- Public event discovery, category filtering, city entry pages, external ticket links, click tracking, and event submission are implemented.
- Production Supabase read access was verified on 2026-09-26. Confirm the connection and event freshness again during each release; this is not a guarantee that source feeds are current.

## Prioritized phases

### Phase 0 — Release correctness

1. Confirm the Production migration history and apply only unapplied migrations in order.
2. Apply the generated category-constraint migration if it is still pending.
3. Review production data for current dates, working ticket links, venue accuracy, and broad genre coverage.

Completed 2026-09-26: event ticket buttons now require a valid event-specific HTTPS URL; the shared global checkout fallback has been removed from the component. Stale Fan Signal copy has also been removed from global SEO metadata. Event category validation is aligned in the frontend/API; the database constraint migration remains to be applied.

### Phase 1 — Reliable calendar operations

1. Build a protected staff workflow to review, approve, reject, edit, publish, and archive events and submissions.
2. Add validation, duplicate detection, event-date/time-zone handling, and listing freshness checks.
3. Operationalize venue/event ingestion from approved official sources; monitor existing sync functions and retain human review before publication.
4. Define featured-placement rules, labels, term limits, and partner approval so paid placement is transparent.

### Phase 2 — Audience and attribution

1. Standardize outbound ticket click events and capture event ID, venue, genre, and ticket provider without logging sensitive data.
2. Add provider-specific affiliate URLs and attribution only where an approved affiliate agreement exists; keep disclosures beside monetized links.
3. Add an opt-in email signup and a weekly Queen City Picks digest, with consent, unsubscribe, and retention controls.
4. Track visitor-to-event and event-to-ticket click-throughs, email growth, submissions, and partner inquiries in a privacy-conscious dashboard.

### Phase 3 — Partner and revenue extensions

1. Launch self-serve or staff-assisted Venue Spotlight / Artist Feature intake and campaign reporting.
2. Add sponsorship inventory and a lightweight media kit; keep the core discovery calendar free.
3. Expand merch only after product, inventory, fulfillment, and support operations are defined.
4. Consider membership or co-promotes only after audience demand and unit economics are demonstrated.

## Definition of “full functionality” for this product

- Visitors can reliably discover current local events across genres and neighborhoods.
- Each event has accurate venue/date/category data and either its own official ticket destination or a clearly non-ticketing state.
- Submitted listings enter a monitored queue and can be reviewed and published safely.
- Staff can correct and retire stale listings without direct database editing.
- Featured placements are clearly labeled; outbound clicks are measurable; affiliate claims match actual provider tracking.
- Email capture is consent-based, and performance metrics cover discovery, clicks, submissions, and partnerships.

## Engineering checks

Run from `apps/web`:

```bash
npm run lint
npm run test:run
npm run build
```

Current known lint debt: `src/lib/votes-store.ts` has two `no-explicit-any` errors. The production build and existing test suite have passed during recent work; run all three checks again before release.
