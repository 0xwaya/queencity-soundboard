alter table public.events drop constraint if exists events_category_check;
alter table public.events
add constraint events_category_check check (
        category in (
            'country',
            'alternative',
            'rock',
            'hiphop',
            'pop',
            'rnb',
            'latin',
            'edm',
            'jazz',
            'folk',
            'metal',
            'comedy',
            'community',
            'festival',
            'sports',
            'other'
        )
    );