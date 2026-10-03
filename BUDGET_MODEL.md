# QueenCity Soundboard - Publisher Revenue Model

Updated 2026-10-03. QueenCity refers visitors to third-party ticket sellers; it does
not collect ticket face value or pay the seller's per-ticket processing fees.
Historical Ticket Tailor ticket-sales scenarios are not the current business model.

## Revenue streams

| Stream | Stage | Revenue to count |
| --- | --- | --- |
| Ticket affiliates | Approved provider templates; TicketWeb approval pending | Net commission confirmed by the affiliate partner |
| Sponsored event spotlight | Staff-assisted seven-day pilot | Agreed campaign fee, less refunds |
| Venue campaign | Custom 30-day pilot quote | Fee for explicitly agreed and delivered placements |
| Hotel affiliates | Not launched; account approval and curated destinations required | Commission on eligible completed bookings, not hotel booking value |
| Activities/products | Later, subject to approved agreements and audience demand | Partner-confirmed commission |

Keep pending, approved, reversed and paid commissions separate. An approved
commission may not be paid in the same month. Track cash receipts separately;
never add approved commission and its eventual payout together as two revenues.
Sponsor deposits received before delivery are not proof the campaign was fulfilled.

## Pilot offers

- Sponsored event spotlight: proposed $49-$99 for seven days on the homepage and
	sponsored calendar section, an event-specific destination and a visibility/click report.
- Venue campaign: proposed $149-$249 for 30 days, custom deliverables and inventory
	agreed before invoicing. There is no dedicated venue takeover or newsletter offer.
- At most three concurrent sponsored events; standard listings stay free and chronological.
- Quotes define dates, approval, cancellation, refunds and reporting. No minimum
	impressions, ticket sales or bookings are guaranteed. These are price experiments,
	not validated market rates or revenue forecasts.

## Costs

The older planning baseline was approximately $46-$47/month: Vercel Pro $20,
Supabase Pro $25 and domain amortization $1-$2. These are historical estimates,
not verified current invoices. Replace them with actual plan charges and usage.

Include hosting/database overages, email services if introduced, direct sponsor
payment fees, paid marketing and any contracted work. Track operator time for
sales, moderation and reporting separately so pilot margins include effort.
Ticket-provider checkout fees are not QueenCity costs under the referral model.

## Monthly operating model

```text
net_affiliate_commission = partner_approved_commission - commission_reversals
net_sponsorship_revenue = delivered_campaign_fees - sponsor_refunds
publisher_revenue = net_affiliate_commission + net_sponsorship_revenue
operating_contribution = publisher_revenue - actual_operating_costs
economic_contribution = operating_contribution - allocated_operator_time_cost
```

If a partner report already provides net commission, do not subtract reversals
again. Keep cash-flow reporting separate from the delivered/approved revenue model.

Illustration only: two fulfilled $75 event campaigns and one fulfilled $150 venue
campaign produce $300 before refunds, payment fees, infrastructure and labor.
That is not an audience-based forecast; assume no affiliate commission until the
partner reports it. A $10,000 ticket or hotel booking total is not $10,000 of revenue.

## Reporting and launch gates

1. Confirm actual recurring bills and provider/network approval and payout terms.
2. Record sponsored impressions, sponsor clicks, event views and ticket clicks by
	 event and surface. A sponsored impression requires at least 50% visibility for
	 one continuous second, once per placement/surface in the browser session.
3. Join partner sub-ID reports to event IDs where the approved program supports it.
	 Clicks and reservations are not confirmed sales or paid commission.
4. Reconcile campaign delivery, invoices, refunds and cash receipts monthly.
5. Review a 30-day placement pilot; launch a 30-60-day hotel pilot only after approval.
6. Do not add inventory-based merch checkout, memberships or generic ad networks
	 until customer demand and fulfillment operations justify them.
