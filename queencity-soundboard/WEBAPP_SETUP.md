# QueenCity Soundboard Web App Setup

## Run locally
```bash
cd queencity-soundboard/apps/web
cp .env.example .env.local
npm install
npm run dev
```

## Required env
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TICKETING_PROVIDER` (tickettailor|ticketspice|eventbrite)  # default: tickettailor
- `NEXT_PUBLIC_TICKETING_WIDGET_URL`

## Current routes
- `/` Home
- `/events` Published events + ticket checkout CTA
- `/merch` Active merch items
- `/about` About

## Ticket URL resolution
Checkout links resolve in this order:
1. `events.ticket_url` (per-event URL in Supabase)
2. Eventbrite URL from `events.eventbrite_event_id` when provider is `eventbrite`
3. `NEXT_PUBLIC_TICKETING_WIDGET_URL` fallback

## Deployment
- Deploy `apps/web` to Vercel
- Add env vars in Vercel project settings
- Point domain `queencitysoundboard.com` in GoDaddy DNS to Vercel
