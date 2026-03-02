# QueenCity Soundboard — Web App

Frontend for QueenCity Soundboard (Next.js, App Router, TypeScript).

## Run locally
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Required env
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TICKETING_PROVIDER=tickettailor`
- `NEXT_PUBLIC_TICKETING_WIDGET_URL`

## Routes
- `/` Home
- `/events` Published events + ticket CTA
- `/merch` Merch page
- `/about` Brand story

## Deploy
Deploy this directory to Vercel with root set to `apps/web`.
