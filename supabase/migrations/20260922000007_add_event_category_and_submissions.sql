-- Pivot: generalize events beyond single-venue/Latin-only, add event intake
alter table public.events
add column if not exists category text not null default 'other' check (
        category in (
            'latin',
            'hiphop',
            'rock',
            'pop',
            'edm',
            'country',
            'jazz',
            'comedy',
            'sports',
            'community',
            'other'
        )
    ),
    add column if not exists source text not null default 'manual' check (source in ('manual', 'sync', 'submission')),
    add column if not exists is_promoted boolean not null default false;
create index if not exists events_status_category_date_idx on public.events (status, category, event_date desc);
create table if not exists public.event_submissions (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    artist_name text,
    venue_name text,
    event_date timestamptz,
    category text,
    description text,
    ticket_url text,
    submitter_name text,
    submitter_email text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create trigger set_event_submissions_updated_at before
update on public.event_submissions for each row execute function public.set_updated_at();
alter table public.event_submissions enable row level security;
-- Anyone can submit an event for review; only admins can read/manage the queue.
create policy "Public insert event submissions" on public.event_submissions for
insert with check (true);
create policy "Admin read event submissions" on public.event_submissions for
select using (public.is_admin());
create policy "Admin update event submissions" on public.event_submissions for
update using (public.is_admin());