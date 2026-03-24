# QueenCity Soundboard 🔊

**Cincinnati’s cleanest cultural event platform.**
Bridging Venezuelan artists, Midwest roots music lovers, and unforgettable live nights.

> Not just ticket links. We curate moments.

## What this repo is
A web-first, mobile-friendly platform for:
- Event discovery
- Third-party ticket checkout (no in-house payment risk)
- Merch + fan engagement
- Scalable venue/event ops backend

## Stack
- **Web:** Next.js on Vercel
- **Data/Auth/Storage:** Supabase
- **Ticketing:** Ticket Tailor widget

## Runtime notes
- Locale switching uses a client-side `qcs_locale` preference cookie only. It stores language choice, not auth or sensitive user data.
- Next.js 16 route APIs such as `cookies()` and `searchParams` must be handled asynchronously in server components.

## Why this architecture
- Fast to ship
- Low fixed cost
- Pro UX out of the gate
- Security-first (reduced PCI scope)

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
- Keep `apps/web/.env.local` as temporary runtime material only.
- Commit `apps/web/.env.encrypted` when you need shared encrypted defaults.
- Set `QCS_ENV_PASSPHRASE` in your shell, or enter passphrase interactively.

## Core docs
- `PLAN.md` — build sequence
- `DEPLOYMENT_STEPS.md` — setup + deploy notes
- `docs/DEPLOY_OWNERSHIP.md` — canonical Vercel ownership/scope + recovery steps
- `SECURITY.md` — security baseline
- `supabase/migrations/*` — production DB schema + RLS

## Brand direction
Clean. Pro. Edgy.
Like a velvet rope with great Wi‑Fi.

---
Built for Queen City culture. Tuned for sell-outs.
