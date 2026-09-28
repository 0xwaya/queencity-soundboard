-- Add external_url column to track source (e.g. Madison Theater event page)
-- Used for automated event syncing and deduplication

alter table if exists public.events
  add column if not exists external_url text;

-- Index for efficient lookups during sync
create index if not exists events_external_url_idx on public.events(external_url);

-- Add constraint to ensure external URLs are HTTPS when present
alter table if exists public.events
  drop constraint if exists events_external_url_https_chk;

alter table if exists public.events
  add constraint events_external_url_https_chk
  check (external_url is null or external_url like 'https://%');
