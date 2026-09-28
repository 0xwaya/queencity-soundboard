update public.poll_artists
set is_active = false
where name in (
        'Stevie B',
        'Fulanito',
        'Lisette Melendez',
        'Elite Latin throwback DJ'
    );
insert into public.poll_artists (name, category, sort_order)
values ('Tyler Childers', 'country', 2),
    ('The National', 'alternative', 3),
    ('The Black Keys', 'rock', 4),
    ('21 Savage', 'hiphop', 5) on conflict (name) do
update
set category = excluded.category,
    sort_order = excluded.sort_order,
    is_active = true;