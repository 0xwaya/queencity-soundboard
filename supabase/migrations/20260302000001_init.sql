-- QueenCity Soundboard: Production foundation
create extension if not exists pgcrypto;

-- helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- admin guard (uses JWT app_metadata.roles: ["admin"])
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false);
$$;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  capacity int check (capacity is null or capacity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  artist_name text not null,
  hero_image_url text,
  event_date timestamptz not null,
  venue_id uuid references public.venues(id) on delete set null,
  eventbrite_event_id text unique,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.merch (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  inventory_count int not null default 0 check (inventory_count >= 0),
  image_url text,
  shipping_available boolean not null default true,
  pickup_available boolean not null default false,
  event_id uuid references public.events(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  customer_email text,
  fulfillment_type text check (fulfillment_type in ('shipping','pickup')),
  event_id uuid references public.events(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','paid','failed','fulfilled','refunded')),
  total_cents int not null default 0 check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  merch_id uuid references public.merch(id) on delete set null,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);

-- inventory reservations (strict mode support)
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  merch_id uuid not null references public.merch(id) on delete cascade,
  checkout_token text not null unique,
  quantity int not null check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_status_date on public.events(status, event_date desc);
create index if not exists idx_merch_event_active on public.merch(event_id, is_active);
create index if not exists idx_orders_status_created on public.orders(status, created_at desc);
create index if not exists idx_inventory_reservations_merch_exp on public.inventory_reservations(merch_id, expires_at);

create trigger trg_venues_updated before update on public.venues for each row execute function public.set_updated_at();
create trigger trg_events_updated before update on public.events for each row execute function public.set_updated_at();
create trigger trg_merch_updated before update on public.merch for each row execute function public.set_updated_at();
create trigger trg_orders_updated before update on public.orders for each row execute function public.set_updated_at();

-- seed
insert into public.venues (name, address, city, state, capacity)
values ('Madison Theater', '730 Madison Ave', 'Covington', 'KY', 1200)
on conflict do nothing;

-- RLS
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.merch enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_reservations enable row level security;

-- public read policies
create policy "Public read active venues" on public.venues
for select using (is_active = true);

create policy "Public read published events" on public.events
for select using (status = 'published');

create policy "Public read active merch" on public.merch
for select using (is_active = true);

-- admin manage content
create policy "Admin full access venues" on public.venues
for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin full access events" on public.events
for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin full access merch" on public.merch
for all using (public.is_admin()) with check (public.is_admin());

-- orders: users can insert own checkout-intent rows (optional anon), no public read
create policy "Anon/auth create orders" on public.orders
for insert with check (true);

create policy "Service role manage orders" on public.orders
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role manage order_items" on public.order_items
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service role manage inventory reservations" on public.inventory_reservations
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
