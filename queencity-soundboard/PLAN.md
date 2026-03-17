# QueenCity Soundboard — Build Plan (Optimized)

## Decision
Use **Strict inventory enforcement** (A).
Reason: drops/events + limited merch = oversell risk > engineering complexity.

## Phase 1 (today)
1. Supabase project bootstrap
2. Run SQL migration in `supabase/migrations/20260302_000001_init.sql`
3. Create `images` public bucket
4. Set env + connect CLI

## Phase 2
1. Edge function: `create-checkout-session`
2. Edge function: `stripe-webhook` (signature validation + idempotency)
3. Reservation expiration cleanup (scheduled)

## Phase 3
1. Next.js website (events, merch, checkout)
2. Admin panel (publish events, inventory)
3. React Native app (consumer view)

## Marketing / Email
- Ticket Tailor broadcast email integration (see: https://help.tickettailor.com/en/articles/10855089-how-to-use-email-marketing-to-promote-your-events)

## Required from owner
- Supabase project ref
- Supabase URL + anon key + service role key
- Stripe secret key + webhook secret + publishable key
- Eventbrite token (optional for first deploy)
- GoDaddy DNS access to point `queencitysoundboard.com`
