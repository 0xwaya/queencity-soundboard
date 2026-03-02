# Terms + Cost Notes (Initial Research) — 2026-03-02

## Stack confirmed
- Web: Vercel (Next.js)
- Data/Auth/Storage: Supabase
- Payments/Ticketing: third-party widget (no in-house processor logic)

## Supabase (official pages checked)
- Pricing page: https://supabase.com/pricing
- Terms: https://supabase.com/terms (last modified text seen: 11 Jul 2025)

### Practical pricing baseline
- Pro plan is commonly listed at **$25/project/month** (+ usage overages).
- Typical overage dimensions to verify before go-live:
  - Database size
  - Bandwidth/egress
  - Storage
  - Auth MAU
  - Edge function invocations/compute

### Terms highlights to review before production
- Mandatory arbitration/class-action waiver language appears in terms.
- Service usage restrictions and acceptable-use constraints apply.
- Confirm data/privacy obligations for customer PII and event attendee data.

## Stripe (official pages checked)
- Pricing: https://stripe.com/pricing
- Services Agreement: https://stripe.com/legal/ssa

### Practical pricing baseline (US cards)
- Standard online cards often shown as **2.9% + $0.30** per successful domestic transaction.
- International card surcharge and optional product fees may apply.

### Legal/ops note
- If this brand is a separate legal entity/descriptor, consider a dedicated Stripe account/profile to reduce disputes.

## Ticketing widget options (initial)

### TicketSpice
- Pricing page checked: https://www.ticketspice.com/pricing
- Publicly advertised baseline from page scrape:
  - **$0.99 per paid ticket** (+ card processing, often 2.9% + $0.30)
  - Fees lower for tickets under $5 (advertised 49¢)
- Supports embeddable workflows and API/webhooks (as advertised on pricing page).

### Ticket Tailor
- Direct fetch blocked during scrape, but official references found:
  - https://www.tickettailor.com/en-us/pricing
  - https://www.tickettailor.com/legal/terms-and-conditions
- Research snapshots commonly cite pay-as-you-sell fee around **$0.85/ticket** (+ processor fees), but must verify on official page manually.

## Recommendation for fastest safe launch
1. Use **third-party ticket widget** for checkout and ticketing (TicketSpice or Ticket Tailor).
2. Keep Supabase for events/catalog/admin data.
3. Keep Stripe owned by ticketing provider flow or your own Stripe via provider integration.
4. Validate legal docs manually before launch:
   - Supabase terms + DPA/privacy
   - Ticket platform terms, payout timing, refund/dispute policy
   - Stripe entity/descriptor setup for this brand

## Cost model template (fill with confirmed values)
- Monthly infra fixed:
  - Supabase Pro: $25
  - Vercel: $0–$20+ (depends on tier)
- Per-ticket variable:
  - Ticket platform fee: $__
  - Payment processing: __% + $__
- Example effective fee on $25 ticket:
  - platform_fee + (processing_percent * 25) + fixed_processing_fee
