-- Sitrade training schema.
-- Balances, orders, deposits, and withdrawals are simulated application data.
-- This script does not connect a bank, blockchain, or real exchange.
--
-- Apply it in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db query --linked -f supabase/migrations/20261002130000_initial_schema.sql
--
-- The first administrator is not created here. After you register, promote
-- that account from the SQL editor (run as postgres, not as the user):
--
--   update public.profiles
--   set role_id = (select id from public.roles where name = 'super_admin')
--   where email = 'you@example.com';

create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin', 'super_admin');
create type public.account_status as enum ('active', 'suspended');
create type public.order_side as enum ('buy', 'sell');
create type public.order_type as enum ('market', 'limit', 'stop');
create type public.order_status as enum (
  'inactive',
  'open',
  'partially_filled',
  'filled',
  'cancelled',
  'rejected'
);
create type public.transaction_type as enum (
  'deposit',
  'withdrawal',
  'trade',
  'fee',
  'admin_adjustment'
);
create type public.ledger_status as enum (
  'pending',
  'processing',
  'completed',
  'rejected',
  'cancelled'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name public.user_role not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  email text not null,
  phone text,
  avatar_url text,
  role_id uuid not null references public.roles (id),
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  provider_asset_id text not null unique,
  quote_currency text not null default 'GBP',
  listed boolean not null default false,
  trading_enabled boolean not null default false,
  deposits_enabled boolean not null default false,
  withdrawals_enabled boolean not null default false,
  min_order numeric(36, 18) not null default 0 check (min_order >= 0),
  withdrawal_fee numeric(36, 18) not null default 0 check (withdrawal_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trading_pairs (
  id uuid primary key default gen_random_uuid(),
  base_asset_id uuid not null references public.assets (id),
  quote_asset_id uuid not null references public.assets (id),
  symbol text not null unique,
  trading_enabled boolean not null default false,
  min_order numeric(36, 18) not null default 0 check (min_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (base_asset_id, quote_asset_id),
  check (base_asset_id <> quote_asset_id)
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  asset_id uuid not null references public.assets (id),
  available numeric(36, 18) not null default 0 check (available >= 0),
  locked numeric(36, 18) not null default 0 check (locked >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_id, asset_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  pair_id uuid not null references public.trading_pairs (id),
  side public.order_side not null,
  type public.order_type not null,
  price numeric(36, 18) check (price is null or price > 0),
  stop_price numeric(36, 18) check (stop_price is null or stop_price > 0),
  amount numeric(36, 18) not null check (amount > 0),
  filled numeric(36, 18) not null default 0 check (filled >= 0),
  remaining numeric(36, 18) not null check (remaining >= 0),
  status public.order_status not null default 'open',
  fee numeric(36, 18) not null default 0 check (fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  user_id uuid not null references public.profiles (id),
  pair_id uuid not null references public.trading_pairs (id),
  side public.order_side not null,
  price numeric(36, 18) not null check (price > 0),
  amount numeric(36, 18) not null check (amount > 0),
  fee numeric(36, 18) not null default 0 check (fee >= 0),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  type public.transaction_type not null,
  asset_id uuid references public.assets (id),
  amount numeric(36, 18) not null,
  status public.ledger_status not null default 'completed',
  reference text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  asset_id uuid not null references public.assets (id),
  amount numeric(36, 18) not null check (amount > 0),
  status public.ledger_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  asset_id uuid not null references public.assets (id),
  amount numeric(36, 18) not null check (amount > 0),
  fee numeric(36, 18) not null default 0 check (fee >= 0),
  destination text not null,
  status public.ledger_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  asset_id uuid not null references public.assets (id),
  created_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null,
  target_user_id uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null,
  target_user_id uuid references public.profiles (id),
  asset_id uuid references public.assets (id),
  previous_value text,
  new_value text,
  note text,
  created_at timestamptz not null default now()
);

create index profiles_role_id_idx on public.profiles (role_id);
create unique index profiles_email_idx on public.profiles (lower(email)) where email <> '';
create index profiles_status_idx on public.profiles (status);
create index wallet_balances_wallet_id_idx on public.wallet_balances (wallet_id);
create index orders_user_status_idx on public.orders (user_id, status, created_at desc);
create index trades_user_created_idx on public.trades (user_id, created_at desc);
create index transactions_user_created_idx on public.transactions (user_id, created_at desc);
create index deposits_user_status_idx on public.deposits (user_id, status, created_at desc);
create index withdrawals_user_status_idx on public.withdrawals (user_id, status, created_at desc);
create index notifications_user_read_idx on public.notifications (user_id, read, created_at desc);
create index watchlists_user_idx on public.watchlists (user_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create trigger assets_updated_at before update on public.assets
for each row execute function public.set_updated_at();
create trigger trading_pairs_updated_at before update on public.trading_pairs
for each row execute function public.set_updated_at();
create trigger wallets_updated_at before update on public.wallets
for each row execute function public.set_updated_at();
create trigger wallet_balances_updated_at before update on public.wallet_balances
for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger deposits_updated_at before update on public.deposits
for each row execute function public.set_updated_at();
create trigger withdrawals_updated_at before update on public.withdrawals
for each row execute function public.set_updated_at();

insert into public.roles (name, description) values
  ('user', 'Training account'),
  ('admin', 'Operations administrator'),
  ('super_admin', 'Platform owner');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles as profile
    join public.roles as role on role.id = profile.role_id
    where profile.id = auth.uid()
      and profile.status = 'active'
      and role.name in ('admin', 'super_admin')
  );
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed';
  end if;

  if current_user in ('authenticated', 'anon') then
    if new.role_id is distinct from old.role_id
      or new.status is distinct from old.status
      or new.email is distinct from old.email
      or new.created_at is distinct from old.created_at then
      raise exception 'Role, status, and email cannot be changed from the client';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_protect_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role_id uuid;
  account_name text;
begin
  select id into user_role_id from public.roles where name = 'user';

  account_name = btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  if char_length(account_name) < 1 then
    account_name = 'Trader';
  end if;
  if char_length(account_name) > 80 then
    account_name = left(account_name, 80);
  end if;

  insert into public.profiles (id, full_name, email, role_id)
  values (new.id, account_name, coalesce(new.email, ''), user_role_id);

  insert into public.wallets (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_privileges() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.roles to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.assets, public.trading_pairs to authenticated;
grant select on public.wallets, public.wallet_balances to authenticated;
grant select on public.orders, public.trades, public.transactions to authenticated;
grant select on public.deposits, public.withdrawals, public.notifications to authenticated;
grant select, insert, delete on public.watchlists to authenticated;
grant select on public.admin_actions, public.audit_logs to authenticated;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.trading_pairs enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.transactions enable row level security;
alter table public.deposits enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.watchlists enable row level security;
alter table public.admin_actions enable row level security;
alter table public.audit_logs enable row level security;

create policy roles_select on public.roles
for select to authenticated
using (true);

create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy assets_select on public.assets
for select to authenticated
using (true);

create policy trading_pairs_select on public.trading_pairs
for select to authenticated
using (true);

create policy wallets_select on public.wallets
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy wallet_balances_select on public.wallet_balances
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.wallets as wallet
    where wallet.id = wallet_balances.wallet_id
      and wallet.user_id = auth.uid()
  )
);

create policy orders_select on public.orders
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy trades_select on public.trades
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy transactions_select on public.transactions
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy deposits_select on public.deposits
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy withdrawals_select on public.withdrawals
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_select on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy watchlists_select on public.watchlists
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy watchlists_insert on public.watchlists
for insert to authenticated
with check (user_id = auth.uid());

create policy watchlists_delete on public.watchlists
for delete to authenticated
using (user_id = auth.uid());

create policy admin_actions_select on public.admin_actions
for select to authenticated
using (public.is_admin());

create policy audit_logs_select on public.audit_logs
for select to authenticated
using (public.is_admin());
