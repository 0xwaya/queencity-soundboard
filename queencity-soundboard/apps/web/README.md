# QueenCity Soundboard Web App

Mobile-first event and merch front-end for QueenCity Soundboard.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TICKETING_PROVIDER` (`tickettailor` | `ticketspice` | `eventbrite`)
- `NEXT_PUBLIC_TICKETING_WIDGET_URL` (global fallback checkout link)

## Ticketing behavior

The checkout button resolves in this order:

1. `events.ticket_url` from Supabase (recommended per event)
2. Eventbrite URL from `events.eventbrite_event_id` when provider is `eventbrite`
3. `NEXT_PUBLIC_TICKETING_WIDGET_URL` as global fallback

## Routes

- `/` Home
- `/events` Published events + checkout CTA
- `/merch` Active merch items
- `/about` Brand story

## Deploy

Deploy `apps/web` to Vercel and add the same environment variables in project settings.
