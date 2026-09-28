# QueenCity Soundboard Web App

Mobile-first event and merch front-end for QueenCity Soundboard.

## Local setup

```bash
cp apps/web/.env.example apps/web/.env.local
cd apps/web && npm install && cd ..
bash tools/env-crypto.sh encrypt apps/web/.env.local apps/web/.env.encrypted
bash tools/env-crypto.sh clean
bash tools/env-crypto.sh dev
```

`bash tools/env-crypto.sh dev` decrypts to `apps/web/.env.local` for runtime and removes it automatically on exit.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional server-side `SUPABASE_URL` and `SUPABASE_ANON_KEY` for API routes

## Ticketing behavior

Each event's checkout button uses only its own valid HTTPS `events.ticket_url`. Events without a valid per-event ticket link show an unavailable state rather than a shared checkout URL. `NEXT_PUBLIC_TICKETING_WIDGET_URL` is a legacy setting and is not read by the current app.

## Routes

- `/` Home
- `/events` Published events + checkout CTA
- `/merch` Active merch items
- `/about` Brand story

## Deploy

Deploy `apps/web` from `0xwaya/queencity-soundboard-standalone` to Vercel and add the required Supabase environment variables in project settings.
