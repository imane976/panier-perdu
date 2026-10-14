-- Panier Perdu : schéma v1 (à coller dans Supabase > SQL Editor > Run)
-- Les comptes (email, mot de passe, lien magique) sont gérés par Supabase Auth (auth.users).
-- Toutes les écritures métier passent par le serveur (clé « service role », qui contourne RLS).

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'shopify' check (platform in ('shopify')),
  shop_domain text not null,
  access_token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, shop_domain)
);

create table public.shop_settings (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  delay1_hours int not null default 1 check (delay1_hours between 1 and 72),
  delay2_hours int not null default 24 check (delay2_hours between 2 and 168),
  discount_enabled boolean not null default false,
  discount_code text,
  sender_name text
);

create table public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  external_id text not null,
  customer_email text not null,
  items jsonb not null default '[]'::jsonb,
  cart_url text,
  total_cents int not null default 0,
  currency text not null default 'EUR',
  abandoned_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'recovered', 'stopped')),
  created_at timestamptz not null default now(),
  unique (shop_id, external_id)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.abandoned_carts(id) on delete cascade,
  step smallint not null check (step in (1, 2)),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  discount_code text,
  unique (cart_id, step)
);

create table public.recoveries (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null unique references public.abandoned_carts(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 0),
  recovered_at timestamptz not null default now()
);

create index on public.abandoned_carts (shop_id, status);
create index on public.reminders (status, scheduled_at);

-- Sécurité : chaque utilisateur ne voit que ses propres données.
alter table public.subscriptions enable row level security;
alter table public.shops enable row level security;
alter table public.shop_settings enable row level security;
alter table public.abandoned_carts enable row level security;
alter table public.reminders enable row level security;
alter table public.recoveries enable row level security;

create policy "voir son abonnement" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());

create policy "voir ses boutiques" on public.shops
  for select to authenticated using (user_id = auth.uid());

create policy "voir ses réglages" on public.shop_settings
  for select to authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

create policy "modifier ses réglages" on public.shop_settings
  for update to authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

create policy "voir ses paniers" on public.abandoned_carts
  for select to authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id and s.user_id = auth.uid()));

create policy "voir ses relances" on public.reminders
  for select to authenticated
  using (exists (
    select 1 from public.abandoned_carts c join public.shops s on s.id = c.shop_id
    where c.id = cart_id and s.user_id = auth.uid()));

create policy "voir ses commandes récupérées" on public.recoveries
  for select to authenticated
  using (exists (
    select 1 from public.abandoned_carts c join public.shops s on s.id = c.shop_id
    where c.id = cart_id and s.user_id = auth.uid()));

-- La clé de la boutique (access_token) ne doit JAMAIS être lisible depuis le navigateur.
revoke all on public.shops from anon, authenticated;
grant select (id, user_id, platform, shop_domain, created_at) on public.shops to authenticated;
revoke all on public.shop_settings from anon;
revoke all on public.subscriptions, public.abandoned_carts, public.reminders, public.recoveries from anon;
revoke insert, update, delete on public.subscriptions, public.abandoned_carts, public.reminders, public.recoveries from authenticated;
