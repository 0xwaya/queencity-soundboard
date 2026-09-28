-- Hardening pass: constrain ticket URLs to HTTPS and aggregate poll reads via RPC

create or replace function public.is_valid_https_url(candidate text)
returns boolean
language sql
immutable
as $$
  select candidate is null or candidate ~* '^https://[^[:space:]]+$';
$$;

update public.events
set ticket_url = null
where ticket_url is not null
  and not public.is_valid_https_url(ticket_url);

alter table public.events
  drop constraint if exists events_ticket_url_https_chk;

alter table public.events
  add constraint events_ticket_url_https_chk
  check (public.is_valid_https_url(ticket_url));

create or replace function public.get_artist_vote_totals()
returns table (artist_name text, vote_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select av.artist_name, count(*)::bigint as vote_count
  from public.artist_votes av
  group by av.artist_name
  order by vote_count desc, av.artist_name asc;
$$;

grant execute on function public.get_artist_vote_totals() to anon, authenticated;
