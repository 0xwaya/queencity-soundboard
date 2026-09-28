-- Add ticket_url to events + poll votes table

alter table public.events
  add column if not exists ticket_url text;

create table if not exists public.artist_votes (
  id uuid primary key default gen_random_uuid(),
  artist_name text not null,
  created_at timestamptz not null default now()
);

alter table public.artist_votes enable row level security;

create policy "Public insert votes" on public.artist_votes
  for insert with check (true);

create policy "Public read votes" on public.artist_votes
  for select using (true);
