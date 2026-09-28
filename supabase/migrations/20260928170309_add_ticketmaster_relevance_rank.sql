alter table public.events
add column if not exists ticketmaster_relevance_rank integer check (
        ticketmaster_relevance_rank is null
        or ticketmaster_relevance_rank > 0
    );
create index if not exists events_ticketmaster_relevance_idx on public.events (
    status,
    is_promoted desc,
    ticketmaster_relevance_rank asc nulls last,
    event_date asc
);