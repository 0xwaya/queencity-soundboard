-- Case study item 9: first-party log of outbound ticket clicks made through /go/[id].
-- No anon/authenticated policies on the table: rows are written only by the
-- security-definer function below (called from the server route) and read by admins.
create table if not exists public.outbound_clicks (
    id bigint generated always as identity primary key,
    event_id uuid not null references public.events (id) on delete cascade,
    placement text,
    src text,
    referrer_host text,
    is_bot boolean not null default false,
    created_at timestamptz not null default now()
);
comment on table public.outbound_clicks is 'One row per ticket click routed through /go/[id]; joined with Impact reports by subId1/2/3.';
create index if not exists outbound_clicks_event_time on public.outbound_clicks (event_id, created_at desc);
create index if not exists outbound_clicks_created_at on public.outbound_clicks (created_at desc);
alter table public.outbound_clicks enable row level security;
create policy "Admin read outbound clicks" on public.outbound_clicks for
select using (public.is_admin());

create or replace function public.log_outbound_click(
    p_event_id uuid,
    p_placement text default null,
    p_src text default null,
    p_referrer_host text default null,
    p_is_bot boolean default false
) returns void language plpgsql security definer
set search_path = '' as $$
begin
    -- Only published events can be logged; ignore anything else silently.
    if not exists (
        select 1 from public.events e where e.id = p_event_id and e.status = 'published'
    ) then
        return;
    end if;
    insert into public.outbound_clicks (event_id, placement, src, referrer_host, is_bot)
    values (
        p_event_id,
        nullif(left(regexp_replace(lower(coalesce(p_placement, '')), '[^a-z0-9._:-]+', '-', 'g'), 64), ''),
        nullif(left(regexp_replace(lower(coalesce(p_src, '')), '[^a-z0-9._:-]+', '-', 'g'), 64), ''),
        nullif(left(lower(coalesce(p_referrer_host, '')), 255), ''),
        coalesce(p_is_bot, false)
    );
end;
$$;
revoke all on function public.log_outbound_click(uuid, text, text, text, boolean) from public;
grant execute on function public.log_outbound_click(uuid, text, text, text, boolean) to anon, authenticated, service_role;
