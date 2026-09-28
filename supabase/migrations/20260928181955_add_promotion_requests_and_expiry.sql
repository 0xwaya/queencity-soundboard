-- Paid promoted placements: intake queue plus an expiry date on the promotion itself.
alter table public.events
add column if not exists promoted_until timestamptz;
comment on column public.events.promoted_until is 'End of a paid promotion window; null means no scheduled end.';
create index if not exists events_promoted_until_idx on public.events (promoted_until)
where promoted_until is not null;
create table if not exists public.promotion_requests (
    id uuid primary key default gen_random_uuid(),
    event_id uuid references public.events (id) on delete
    set null,
        event_title text,
        organization text not null,
        contact_name text,
        contact_email text not null,
        contact_phone text,
        package text not null default 'spotlight' check (
            package in (
                'spotlight',
                'featured_week',
                'homepage_takeover',
                'custom'
            )
        ),
        preferred_start date,
        preferred_end date,
        budget_cents integer check (
            budget_cents is null
            or budget_cents >= 0
        ),
        message text,
        status text not null default 'pending' check (
            status in ('pending', 'contacted', 'won', 'lost')
        ),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint promotion_requests_window_check check (
            preferred_start is null
            or preferred_end is null
            or preferred_end >= preferred_start
        )
);
create index if not exists promotion_requests_status_created_idx on public.promotion_requests (status, created_at desc);
create trigger set_promotion_requests_updated_at before
update on public.promotion_requests for each row execute function public.set_updated_at();
alter table public.promotion_requests enable row level security;
-- Anyone may request a placement; only admins can read or work the pipeline.
create policy "Public insert promotion requests" on public.promotion_requests for
insert with check (true);
create policy "Admin read promotion requests" on public.promotion_requests for
select using (public.is_admin());
create policy "Admin update promotion requests" on public.promotion_requests for
update using (public.is_admin());
-- Expire paid placements automatically so a promotion never outlives its term.
create or replace function public.expire_promoted_events() returns void language sql security invoker
set search_path = '' as $$
update public.events
set is_promoted = false,
    promoted_until = null
where is_promoted = true
    and promoted_until is not null
    and promoted_until < now();
$$;
select cron.unschedule('expire-promoted-events')
where exists (
        select 1
        from cron.job
        where jobname = 'expire-promoted-events'
    );
select cron.schedule(
        'expire-promoted-events',
        '5 * * * *',
        $$
        select public.expire_promoted_events();
$$
);