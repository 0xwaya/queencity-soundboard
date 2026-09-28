-- Pivot: retire the single-venue Proyecto Uno/Madison placeholder and seed the
-- broader Cincinnati/NKY venue roster (large rooms + smaller indie venues) so
-- Phase 2 sync/manual entry has real venues to attach events to.
begin;
-- The Proyecto Uno "date TBD" placeholder never resolved to a real booking;
-- archive it instead of presenting stale/unconfirmed content as a live event.
update public.events
set status = 'archived'
where artist_name = 'Proyecto Uno'
    and status = 'published';
insert into public.venues (name, address, city, state, capacity)
select v.name,
    v.address,
    v.city,
    v.state,
    v.capacity
from (
        values (
                'Ludlow Garage',
                '342 Newport Pike',
                'Newport',
                'KY',
                null::int
            ),
            (
                'MOTR Pub',
                '1345 Main St',
                'Cincinnati',
                'OH',
                null::int
            ),
            (
                'Southgate House Revival',
                '111 E 6th St',
                'Newport',
                'KY',
                null::int
            ),
            (
                'The Comet',
                '4579 Hamilton Ave',
                'Cincinnati',
                'OH',
                null::int
            ),
            (
                'Woodward Theater',
                '1404 Main St',
                'Cincinnati',
                'OH',
                null::int
            ),
            (
                'Bogart''s',
                '2621 Vine St',
                'Cincinnati',
                'OH',
                1400
            ),
            (
                'Andrew J Brady Music Center',
                '25 Race St',
                'Cincinnati',
                'OH',
                4800
            ),
            (
                'Taft Theatre',
                '317 E 5th St',
                'Cincinnati',
                'OH',
                2500
            )
    ) as v(name, address, city, state, capacity)
where not exists (
        select 1
        from public.venues existing
        where existing.name = v.name
    );
commit;