# QueenCity Soundboard — Deployment and Release Runbook

## Deployment ownership

- Vercel scope/team: `0xwaya-projects`
- Vercel project: `queencity-soundboard`
- Source repo: `github.com/0xwaya/queencity-soundboard-standalone`
- Root directory: `apps/web`
- Framework: Next.js
- Production domains: `queencitysoundboard.com`, `www.queencitysoundboard.com`
- DNS is managed at GoDaddy; see [DEPLOY_OWNERSHIP.md](docs/DEPLOY_OWNERSHIP.md) for recovery and ownership procedures.

## Current integrations

- Supabase supplies published events and merch; server routes accept event submissions.
- Vercel Production and Preview have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured. Production also has server-side Supabase credentials. Do not print, commit, or copy secret values into this document.
- Local app runtime variables are in ignored `apps/web/.env.local`; `apps/web/.env.vercel` is an ignored local Vercel export, not the authoritative production setting. No `.env` file was found directly in `/Users/pc/.openclaw/workspace/` on 2026-09-30. Manage Preview/Production values in Vercel project settings under `0xwaya-projects/queencity-soundboard`. Supabase Function secrets and Vault values must be checked separately; the local env files do not contain `TICKETMASTER_API_KEY` or `QCS_TICKETMASTER_SYNC_SECRET`.
- Fan voting is paused. The widget and poll storage code are removed; `/api/votes/submit`, `/api/votes/totals`, `/api/votes/health`, and `/api/votes/admin/reset` return 410. Leave existing poll database records intact; legacy `POLL_*`/Upstash variables in old Vercel exports are not needed by the current app.
- Supabase Production connectivity was verified on 2026-09-26 with a read-only published-event count (5 rows at that time). Recheck after incidents and deployments.
- Ticket checkout is hosted by external providers. Ticket buttons require an event-specific HTTPS `events.ticket_url` and a valid affiliate template for its provider; otherwise no outbound ticket link is rendered.
- `NEXT_PUBLIC_TICKETING_WIDGET_URL` may remain in older Vercel settings, but the app no longer reads it. Remove it from project settings after confirming no external workflow depends on it.
- Never expose service-role credentials to the browser.

## Local preflight

From the repository root:

```bash
cd apps/web
npm install
cp .env.example .env.local
```

Set local variables using the encrypted-env workflow documented in the root README. Do not paste credentials into source control or chat. Then validate:

```bash
npm run lint
npm run test:run
npm run build
```

Known lint debt is documented in `PLAN.md`; distinguish it from newly introduced failures.

## Supabase migration process

1. Confirm the target project and inspect its migration history before applying SQL.
2. Apply only migrations not already recorded as applied, in filename order from `supabase/migrations/`.
3. Do not blindly rerun historical migrations or seed scripts in Production.
4. Confirm event/venue data, RLS policies, and the pending event-submission queue after schema changes.
5. Verify that the anonymous browser key can read only intended public data and that staff-only operations remain protected by `public.is_admin()` or a server-side authorization boundary.

The current database includes event categories, event submissions, promoted events, ticket URL hardening, and a poll-artists table retained for historical data. Do not drop poll records as part of pausing voting. The new `expand_event_categories` migration widens the event category constraint to match the submission UI/API; inspect Production migration history and apply it if pending. Review migrations before applying; migration history is authoritative.

## Vercel release

1. Confirm the linked project, scope, root directory, and production branch before deployment.
2. Verify required environment-variable names and target environments in Vercel without exposing values. Required public names currently include `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Configure the appropriate `NEXT_PUBLIC_AFFILIATE_TEMPLATE_<PROVIDER>` for each ticket provider using the actual tracking template issued by its affiliate program; `NEXT_PUBLIC_IMPACT_PUBLISHER_ID` is available for Impact templates.
3. Confirm each configured affiliate template produces a valid HTTPS tracking URL with the event destination and sub-ID placeholders. Do not treat a normal ticket URL as an affiliate link.
4. Deploy to Preview and test data reads, ticket links, event submission, and mobile navigation.
5. Promote/deploy to Production through the normal Vercel workflow.

## Release QA checklist

- [ ] Home Ticket Spotlight selects a future published event with its own valid ticket URL, or shows the browse-events fallback.
- [ ] Ticket buttons use affiliate tracking URLs that preserve the event-specific destination; rows without a valid affiliate template show no checkout link.
- [ ] Events page shows published rows, category filters, and both view modes.
- [ ] City hubs and canonical metadata resolve correctly.
- [ ] Partner event submissions validate, return a useful confirmation, and enter the pending Supabase queue.
- [ ] Submission failures and Supabase outages are visible to the visitor and logged without exposing secrets or personal data.
- [ ] Promoted placement is labeled; affiliate disclosure is adjacent to links that may earn commission.
- [ ] English and Spanish copy is correct for the routes that claim localization.
- [ ] Mobile/desktop layout, keyboard focus, reduced motion, and contrast are checked.
- [ ] `/robots.txt` and `/sitemap.xml` return successfully; structured data matches current page content.
- [ ] No stale Fan Signal/Latin-only lead copy remains in the current public experience unless explicitly intended for a specific event.
- [ ] All `/api/votes/*` endpoints return HTTP 410 and no voting control appears in the public UI.

## After release

Review Vercel Analytics for page visits and outbound event/ticket clicks. Monitor Supabase reads, submissions, sync-function outcomes, and stale listings. Track visitor growth, email signups (when the opt-in flow exists), ticket clicks, event submissions, and partner inquiries as separate metrics.
