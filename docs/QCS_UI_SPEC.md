# QueenCity Soundboard — Current UI Specification

This document describes the shipped event-discovery interface, not the retired Latin Acoustic Series campaign concept.

## Product experience

- Audience: Cincinnati and Northern Kentucky locals, transplants, and visitors seeking live music, comedy, and cultural events across genres.
- Primary job: find a relevant upcoming event, confirm venue/date details, and continue to the official ticket provider.
- Secondary jobs: submit a missing event, contact the team about promotion/partnership, and browse local merch.
- Checkout is external. The site must not imply that it sells tickets or guarantees availability.

## Page structure

- **Global shell:** animated brand mark, primary links to Events, Merch, Partners, and About, an EN/ES language toggle, responsive mobile navigation, and site footer.
- **Home:** Queen City positioning, genre signals, event discovery and partner CTAs, a Ticket Spotlight chosen from upcoming published events with valid ticket URLs, promoted event content, upcoming listings, and event/partner contact routes.
- **Events:** published-event calendar, category filters derived from active inventory, Spotlight/Compact view toggle, Cincinnati/Covington hubs, event details, and external ticket links.
- **City hubs:** Cincinnati and Covington discovery entry points with links into the calendar and neighboring hub.
- **About:** explains local curation, discovery, official ticket handoff, and participation.
- **Partners:** event submission form plus venue, artist, promoter, and sponsorship inquiry path.
- **Merch:** active catalog browsing; checkout/fulfillment availability depends on the configured product flow.
- **Legacy `/latin-events`:** compatibility route that redirects into the general events calendar with a Latin category filter.

## Visual system

- **Canvas:** near-black, layered navy surfaces with a subtle grid and ambient cyan, fuchsia, and restrained amber highlights.
- **Primary surface:** `#0b1228`; soft surface: `#0c142a`; background: `#07090f`.
- **Accents:** fuchsia `#d946ef`, cyan `#22d3ee`, with amber for selected spotlight/attention states.
- **Text:** primary `#f8fafc`; muted `#94a3b8`; translucent white borders.
- **Typography:** Bebas Neue is loaded for brand display treatment; general interface text currently uses an Inter/Arial/Helvetica CSS stack. Maintain compact, scannable heading hierarchy.
- **Surfaces:** ambient gradient panels for major sections; restrained bordered panels for repeated event items. Avoid adding decorative nested-card layers.
- **Controls:** visible labels for genre and view selection, clear primary/secondary calls to action, keyboard-visible focus states, and reduced-motion support.

## Behavior and trust requirements

- Use per-event official ticket URLs and validate them as HTTPS before presenting an outbound purchase action.
- Identify promoted/paid placements distinctly from editorial picks.
- Place affiliate disclosure next to monetized ticket links, and use an affiliate URL only when an agreement and tracking path are active.
- Show a useful fallback when there are no published events or an event lacks a ticket link; never route unrelated events to a shared checkout destination.
- Event submission confirmation means “received for review,” not “published.”
- English is the primary copy. Spanish is available on selected routes; do not claim the entire product is fully bilingual until all critical flows are translated and tested.
- Preserve semantic headings, descriptive link names, keyboard navigation, adequate contrast, responsive layouts, and reduced-motion behavior.

## Current instrumentation

Vercel Analytics is mounted globally. Internal navigation and ticket/checkout links emit click events. Next steps are to standardize event metadata and connect approved affiliate-provider attribution without recording unnecessary personal data.
