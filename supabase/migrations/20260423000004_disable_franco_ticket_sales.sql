-- Temporarily disable ticket sales for Franco De Vita events pending artist confirmation.

update public.events
set ticket_url = null
where lower(coalesce(artist_name, '')) like '%franco de vita%'
   or lower(coalesce(title, '')) like '%franco de vita%';
