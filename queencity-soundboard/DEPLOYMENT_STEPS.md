# QueenCity Soundboard — Deployment Steps (Patch 1)

## Objective
Ship web-first MVP using:
- Vercel (Next.js hosting)
- Supabase (DB/Auth/Storage)
- Ticket Tailor (hosted checkout/widget)
- GoDaddy (domain DNS)

## 1) Preflight (local)
1. Confirm app runs:
   ```bash
   cd queencity-soundboard/apps/web
   npm install
   cp .env.example .env.local
   cd ..
   bash tools/env-crypto.sh encrypt
   bash tools/env-crypto.sh clean
   bash tools/env-crypto.sh dev
   ```
2. Confirm env template exists: `.env.example`
3. Confirm encrypted env bundle exists: `apps/web/.env.encrypted`
4. Confirm at least one placeholder logo is selected for v0 launch.

## 2) Supabase setup
1. Create project: `queencitysoundboard-prod` (US East)
2. Run migration in SQL editor:
   - `queencity-soundboard/supabase/migrations/20260302_000001_init.sql`
3. Create storage bucket:
   - name: `images`
   - public: `true`
4. Save keys for Vercel env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Seed launch data
1. Add at least one venue (if not seeded)
2. Add one event in `events` with `status='published'`
3. (Optional) add one merch item
4. (Recommended) set `events.ticket_url` per published event for direct checkout links

## 4) Ticket Tailor integration
1. Create event in Ticket Tailor
2. Copy public checkout URL / widget URL
3. Set Vercel env:
   - `NEXT_PUBLIC_TICKETING_WIDGET_URL=<ticket_tailor_url>` (global fallback)

## 5) Vercel deploy
1. Import repo into Vercel
2. Set root directory:
   - `apps/web` (project setting may display as `queencity-soundboard/apps/web`)
3. Confirm framework preset is `nextjs`
4. Add environment variables:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TICKETING_WIDGET_URL`
5. Deploy and verify preview URL

### 5a) Access/Scope sanity check (prevents most Vercel confusion)
Run:
```bash
npx -y vercel whoami
npx -y vercel project ls --scope 0xwaya-projects
npx -y vercel project inspect queencity-soundboard --scope 0xwaya-projects
```
Expected:
- project exists under `0xwaya-projects`
- `Root Directory: apps/web`
- `Framework Preset: nextjs`

## 6) Domain cutover (GoDaddy -> Vercel)
DNS records:
- `A` record: `@` -> `76.76.21.21`
- `CNAME`: `www` -> `cname.vercel-dns.com`

In Vercel project:
- Add domains:
  - `queencitysoundboard.com`
  - `www.queencitysoundboard.com`
- Wait for SSL provisioning

## 7) Launch QA checklist
- [ ] Home renders properly on mobile + desktop
- [ ] Header shell aligns with page content on desktop and mobile
- [ ] Locale toggle switches between `EN`/`ES` and preserves preference after refresh
- [ ] `/events` lists published events
- [ ] Ticket button opens Ticket Tailor flow
- [ ] No secrets exposed in client code
- [ ] Basic performance sanity (no broken images/console errors)
- [ ] Domain + HTTPS active

## 9) Framework notes
- On Next.js 16, server-side `cookies()` and route `searchParams` are async. Treating them synchronously can degrade route performance and break builds.

## 8) Post-launch day-1 ops
- Track:
  - event page visits
  - ticket CTA clicks
  - conversion in Ticket Tailor dashboard
- Patch queue:
  - branding polish
  - admin UX improvements
  - analytics + attribution tuning
