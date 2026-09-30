# QueenCity Soundboard

**Sounds of the Queen City:** Cincinnati + Northern Kentucky's local discovery hub for live music, comedy, and culture across every genre.

We curate the local calendar, connect fans to official ticket links, and help the community find nights worth showing up for.

## What this repo is

A web-first, mobile-friendly local event platform for:

- Multi-genre event discovery across Cincinnati and Northern Kentucky
- Third-party ticket links; checkout stays with the venue or ticketing provider
- Event submissions for review and manually curated listings
- Promoted event placements, venue/artist partnership intake, and merch browsing
- English-first experience with partial Spanish localization

## Stack

- **Web:** Next.js on Vercel
- **Data/Auth/Storage:** Supabase
- **Ticketing:** Event-specific external ticket URLs; missing links are shown as unavailable rather than routing to a shared checkout
- **Canonical GitHub repo:** `github.com/0xwaya/queencity-soundboard`
- **Canonical Vercel project:** `0xwaya-projects/queencity-soundboard`

> The GitHub repository and Vercel project now intentionally use the same name.

## Runtime notes

- Locale switching uses a client-side `qcs_locale` preference cookie only. It stores language choice, not auth or sensitive user data.
- Next.js 16 route APIs such as `cookies()` and `searchParams` must be handled asynchronously in server components.

## Current product status

- Home features a ticket spotlight selected from upcoming published events with ticket links, plus promoted/event listings and submission/partner calls to action.
- `/events` lists published events, category filters derived from available inventory, spotlight/compact views, city hubs, ticket links, and event structured data.
- `/cincinnati` and `/covington` provide local discovery entry points; `/about`, `/partners`, and `/merch` provide supporting product pages.
- Public event submissions are validated and stored in Supabase as pending review. There is no staff moderation dashboard yet.
- The production Supabase connection was read-tested on 2026-09-26; the published-event query returned 5 rows. This confirms connectivity at that time, not the freshness or completeness of the calendar.
- Fan voting is paused: the widget has been removed and all `/api/votes/*` endpoints return HTTP 410. Existing poll records are preserved for a future decision, not served by the app.
- See [Frontend and full-functionality roadmap](docs/FRONTEND_AND_ROADMAP.md) for the shipped experience, known gaps, and recommended sequence.

## Product and operating model

- Curate locally across genres instead of acting as a generic ticket marketplace.
- Keep checkout with official venue and ticketing providers; do not collect payment-card data.
- Build the inventory and partner relationships before adding costly services.
- Treat Latin events as one part of a broader Cincinnati + NKY calendar, not the platform's defining category.

## Quick start

```bash
# one-time setup
cd apps/web
npm install
cp .env.example .env.local

# from repo root: encrypt and remove plaintext
cd ..
bash tools/env-crypto.sh encrypt
bash tools/env-crypto.sh clean

# day-to-day dev: decrypt only for runtime, auto-clean on exit
bash tools/env-crypto.sh dev
```

### Env security workflow

- Local app variables live in `apps/web/.env.local` (ignored) or an encrypted `apps/web/.env.encrypted`; `apps/web/.env.vercel` is an ignored Vercel export. The parent `/Users/pc/.openclaw/workspace/` has no `.env` file as of 2026-09-30. Do not load unrelated OpenClaw credentials into this app.
- Vercel Preview and Production variables live in the `0xwaya-projects/queencity-soundboard` project settings, not in the local shell by default. Supabase Edge Function secrets (`TICKETMASTER_API_KEY`, `QCS_TICKETMASTER_SYNC_SECRET`) and matching Vault settings are separate from Vercel variables. See [DEPLOYMENT_STEPS.md](DEPLOYMENT_STEPS.md) before deploying the sync.
- Supabase does not store the GitHub repository name in this repository's local configuration. If Supabase Dashboard GitHub integration or a CI workflow is enabled, its repository selector must point to `0xwaya/queencity-soundboard`.
- Keep `apps/web/.env.local` and `apps/web/.env.vercel` out of Git; never print or paste values. Use `bash tools/env-crypto.sh status` to check local presence without displaying secrets.
- Commit `apps/web/.env.encrypted` only when shared encrypted defaults are needed.
- Set `QCS_ENV_PASSPHRASE` in your shell, or enter passphrase interactively.

## Core docs

- `PLAN.md` — prioritized delivery phases
- `docs/FRONTEND_AND_ROADMAP.md` — current frontend walkthrough and path to full functionality
- `docs/QCS_UI_SPEC.md` — current interface structure and visual tokens
- `DEPLOYMENT_STEPS.md` — setup, migration, release, and production QA
- `marketing/queen-city-picks-30-day-calendar.md` — all-genres editorial calendar
- `docs/DEPLOY_OWNERSHIP.md` — canonical Vercel ownership/scope + recovery steps
- `SECURITY.md` — security baseline
- `supabase/migrations/*` — production DB schema + RLS

Older Latin Acoustic Series files in `marketing/` and `branding/` are campaign/heritage material; they are not the current platform-wide positioning.
