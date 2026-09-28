begin;
update public.events as event
set status = 'archived'
from public.venues as venue
where event.venue_id = venue.id
    and lower(venue.name) in ('madison theater', 'madison live')
    and event.status <> 'archived';
update public.venues
set is_active = false
where lower(name) in ('madison theater', 'madison live');
insert into public.venues (name, city, state)
select target.name,
    target.city,
    target.state
from (
        values ('Riverbend Music Center', 'Cincinnati', 'OH'),
            ('PNC Pavilion', 'Cincinnati', 'OH'),
            ('MegaCorp Pavilion', 'Newport', 'KY'),
            ('Heritage Bank Center', 'Cincinnati', 'OH'),
            ('Memorial Hall OTR', 'Cincinnati', 'OH'),
            (
                'Hard Rock Casino Cincinnati',
                'Cincinnati',
                'OH'
            ),
            ('Annie''s Music Center', null, null),
            ('Seatfun Stages', null, null)
    ) as target(name, city, state)
where not exists (
        select 1
        from public.venues as existing
        where lower(existing.name) = lower(target.name)
    );
commit;