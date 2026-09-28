-- Replace the previous Franco De Vita placeholder with the confirmed Proyecto Uno concept.
-- The schema requires event_date, so the app treats Proyecto Uno as Date TBD until a real date is set.

update public.events
set
  title = '90''s Hiphop Merengue: Proyecto Uno Live',
  description = 'Proyecto Uno confirmed interest in performing in Cincinnati. Date TBD for a 90''s merengue hiphop night.',
  artist_name = 'Proyecto Uno',
  hero_image_url = '/proyecto-uno-live.jpg',
  event_date = '2026-12-31 20:00:00-05'::timestamptz,
  ticket_url = null,
  status = 'published'
where lower(coalesce(artist_name, '')) like '%franco de vita%'
   or lower(coalesce(title, '')) like '%franco de vita%'
   or title = 'Caracas Unplugged: After Dark Sessions';

update public.events
set status = 'archived'
where title = 'Merenhouse Unplugged: After Dark Energy Session'
  and artist_name = 'Proyecto Uno';
