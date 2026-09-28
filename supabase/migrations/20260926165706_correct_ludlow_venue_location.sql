update public.venues
set address = '342 Ludlow Ave',
    city = 'Cincinnati',
    state = 'OH'
where lower(name) = 'ludlow garage'
    and is_active = true;