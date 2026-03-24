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
- `NEXT_PUBLIC_TICKETING_WIDGET_URL` (Ticket Tailor global fallback checkout link)

## Ticketing behavior (Ticket Tailor)

The checkout button resolves in this order:

1. `events.ticket_url` from Supabase (recommended per event)
2. `NEXT_PUBLIC_TICKETING_WIDGET_URL` as global fallback

## Routes

- `/` Home
- `/events` Published events + checkout CTA
- `/merch` Active merch items
- `/about` Brand story

## Deploy

Deploy `apps/web` to Vercel and add the same environment variables in project settings.
