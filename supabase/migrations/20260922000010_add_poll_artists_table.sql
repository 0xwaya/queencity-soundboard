-- DB-backed poll artist list (replaces the hardcoded POLL_ARTISTS array).
create table if not exists public.poll_artists (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    category text,
    is_active boolean not null default true,
    sort_order int not null default 0,
    created_at timestamptz not null default now()
);
alter table public.poll_artists enable row level security;
create policy "Public read active poll artists" on public.poll_artists for
select using (is_active = true);
create policy "Admin manage poll artists" on public.poll_artists for all using (public.is_admin()) with check (public.is_admin());
insert into public.poll_artists (name, category, sort_order)
select v.name,
    v.category,
    v.sort_order
from (
        values ('Ilegales', 'latin', 1),
            ('Stevie B', 'latin', 2),
            ('Fulanito', 'latin', 3),
            ('Lisette Melendez', 'latin', 4),
            ('Elite Latin throwback DJ', 'latin', 5)
    ) as v(name, category, sort_order)
where not exists (
        select 1
        from public.poll_artists existing
        where existing.name = v.name
    );