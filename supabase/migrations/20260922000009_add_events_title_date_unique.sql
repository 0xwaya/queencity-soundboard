-- Both sync functions upsert on (title, event_date), but no matching unique
-- constraint exists yet -- ON CONFLICT silently cannot target it without one.
begin;
-- Drop exact duplicate (title, event_date) rows, keeping the oldest row.
delete from public.events a using public.events b
where a.title = b.title
    and a.event_date = b.event_date
    and a.id > b.id;
alter table public.events
add constraint events_title_event_date_key unique (title, event_date);
commit;