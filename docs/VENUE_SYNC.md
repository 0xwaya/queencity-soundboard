# Local Event and Venue Sources

QueenCity Soundboard publishes real upcoming events across Cincinnati and Northern Kentucky. Never seed sample lineups, infer a booking from artist interest, or publish a placeholder date as an event.

## Venue priorities

The local discovery roster prioritizes:

- Riverbend Music Center and PNC Pavilion
- Andrew J. Brady Music Center
- MegaCorp Pavilion and Heritage Bank Center
- Bogart's, Ludlow Garage, and Southgate House Revival
- Taft Theatre, Woodward Theater, and Memorial Hall OTR
- Hard Rock Cincinnati event spaces
- Annie's Music Center and Seatfun Stages

Existing venue records may use minor naming differences from Ticketmaster. Sync-created venues should be reviewed for duplicates and location accuracy before promotion.

## Current event source

`sync-ticketmaster-events` queries the Ticketmaster Discovery API for upcoming events within 25 miles of Cincinnati. It pages through up to 500 upcoming music results in date order and searches the Cincinnati Ludlow Garage venue directly, while also fetching arts and theatre, comedy, and sports. Music can contribute up to 80 shows total, 30 per genre category, and six per venue; other categories retain a ten-event limit. Repeated showtimes with the same title and venue are represented by the earliest upcoming showing. The public calendar sorts by event date before promotion and Ticketmaster relevance; only non-music results have a Ticketmaster relevance rank. The sync upserts the actual event, venue, and official ticket URL. It requires the Supabase Edge Function secret `TICKETMASTER_API_KEY`. Venues without Ticketmaster Discovery listings still require verified manual coverage.

The twice-daily `sync-ticketmaster-events` schedule is installed by migration `20260928174929_schedule_ticketmaster_sync.sql`. `supabase/config.toml` disables gateway JWT verification for this function because `pg_net` authenticates with the handler's required `x-qcs-sync-secret` instead. Deploy the function with that config in effect, set its `TICKETMASTER_API_KEY` and `QCS_TICKETMASTER_SYNC_SECRET` function secrets, and store `project_url` plus `qcs_ticketmaster_sync_secret` in Supabase Vault. The Vault sync secret must exactly match the Edge Function secret. Verify that the cron job is active and inspect its `pg_net` responses after deployment; a scheduled job without these prerequisites is not an operational feed. A populated venue roster alone does not create events. Do not claim an event is trending or promoted unless the data supports that label.

## Deprecated Madison Theater Sync

Madison Theater sync is deprecated and out of scope. Its records are archived, and the former endpoint returns HTTP 410. Do not add new listings for this venue unless the operating status and current schedule are confirmed and the venue is explicitly reactivated.

## Review rules

- Require a real event title, future date, venue, and a source page before publication.
- Use only the event's official venue, organizer, artist, or ticket-provider URL for ticket actions.
- Treat Ticketmaster relevance as an ordering signal, not a paid promotion or a guarantee of popularity.
- Keep expired and inactive-venue listings out of the public calendar.
- For venues not covered by an aggregator, review and publish verified events manually; do not fabricate a schedule to fill the calendar.
