-- Simulated trading engine.
-- Orders fill against a caller-supplied CoinGecko reference price.
-- No order is sent to an exchange, bank, or blockchain.

alter table public.orders
  add column client_token uuid;

create unique index orders_client_token_idx
  on public.orders (client_token)
  where client_token is not null;

create table public.platform_settings (
  id integer primary key default 1 check (id = 1),
  taker_fee_rate numeric(12, 8) not null default 0.001 check (taker_fee_rate >= 0 and taker_fee_rate < 1),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, taker_fee_rate)
values (1, 0.001)
on conflict (id) do nothing;

update public.assets
set trading_enabled = true
where symbol in ('BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'USDT', 'BNB', 'AVAX', 'DOT', 'LINK');

insert into public.trading_pairs (base_asset_id, quote_asset_id, symbol, trading_enabled, min_order)
select base.id, quote.id, base.symbol || '/USDT', true, 0
from public.assets as base
join public.assets as quote on quote.symbol = 'USDT'
where base.symbol <> 'USDT'
on conflict (symbol) do update
set trading_enabled = true;

alter table public.platform_settings enable row level security;

create policy platform_settings_select on public.platform_settings
for select to authenticated
using (true);

grant select on public.platform_settings to authenticated;

create or replace function public.taker_fee_rate()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select taker_fee_rate from public.platform_settings where id = 1), 0.001);
$$;

create or replace function public.lock_available(
  target_wallet uuid,
  target_asset uuid,
  qty numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  held numeric;
begin
  if qty is null or qty <= 0 then
    raise exception 'Amount cannot be zero.';
  end if;

  insert into public.wallet_balances (wallet_id, asset_id, available, locked)
  values (target_wallet, target_asset, 0, 0)
  on conflict (wallet_id, asset_id) do nothing;

  select available into held
  from public.wallet_balances
  where wallet_id = target_wallet
    and asset_id = target_asset
  for update;

  if held is null or held < qty then
    raise exception 'Insufficient simulated balance.';
  end if;

  update public.wallet_balances
  set available = available - qty,
      locked = locked + qty
  where wallet_id = target_wallet
    and asset_id = target_asset;
end;
$$;

create or replace function public.unlock_available(
  target_wallet uuid,
  target_asset uuid,
  qty numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  held numeric;
begin
  if qty is null or qty <= 0 then
    return;
  end if;

  select locked into held
  from public.wallet_balances
  where wallet_id = target_wallet
    and asset_id = target_asset
  for update;

  if held is null or held < qty then
    raise exception 'Locked balance is short.';
  end if;

  update public.wallet_balances
  set locked = locked - qty,
      available = available + qty
  where wallet_id = target_wallet
    and asset_id = target_asset;
end;
$$;

create or replace function public.consume_locked(
  target_wallet uuid,
  target_asset uuid,
  qty numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  held numeric;
begin
  if qty is null or qty <= 0 then
    return;
  end if;

  select locked into held
  from public.wallet_balances
  where wallet_id = target_wallet
    and asset_id = target_asset
  for update;

  if held is null or held < qty then
    raise exception 'Locked balance is short.';
  end if;

  update public.wallet_balances
  set locked = locked - qty
  where wallet_id = target_wallet
    and asset_id = target_asset;
end;
$$;

create or replace function public.settle_simulated_order(
  target_order uuid,
  execution_price numeric,
  funds_locked boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fresh public.orders%rowtype;
  wallet uuid;
  base_asset uuid;
  quote_asset uuid;
  rate numeric;
  fee_amount numeric;
  notional numeric;
  required numeric;
  reserved numeric;
  anchor numeric;
begin
  if execution_price is null or execution_price <= 0 or execution_price > 1000000000000 then
    raise exception 'Enter a valid price.';
  end if;

  select * into fresh
  from public.orders
  where id = target_order
  for update;

  if fresh.id is null or fresh.status not in ('open', 'inactive') then
    return false;
  end if;

  select pair.base_asset_id, pair.quote_asset_id
  into base_asset, quote_asset
  from public.trading_pairs as pair
  where pair.id = fresh.pair_id;

  if base_asset is null then
    raise exception 'That trading pair does not exist.';
  end if;

  select id into wallet
  from public.wallets
  where user_id = fresh.user_id
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  rate := public.taker_fee_rate();
  if fresh.type = 'limit' then
    execution_price := fresh.price;
    fee_amount := fresh.fee;
  else
    fee_amount := execution_price * fresh.amount * rate;
  end if;
  notional := execution_price * fresh.amount;

  if fresh.side = 'buy' then
    required := notional + fee_amount;
    if funds_locked then
      anchor := case when fresh.type = 'limit' then fresh.price else fresh.stop_price end;
      reserved := fresh.amount * anchor + fresh.fee;
      if required <= reserved then
        perform public.consume_locked(wallet, quote_asset, required);
        perform public.unlock_available(wallet, quote_asset, reserved - required);
      else
        perform public.apply_simulated_delta(wallet, quote_asset, -(required - reserved));
        perform public.consume_locked(wallet, quote_asset, reserved);
      end if;
    else
      perform public.apply_simulated_delta(wallet, quote_asset, -required);
    end if;
    perform public.apply_simulated_delta(wallet, base_asset, fresh.amount);
  else
    if funds_locked then
      perform public.consume_locked(wallet, base_asset, fresh.amount);
    else
      perform public.apply_simulated_delta(wallet, base_asset, -fresh.amount);
    end if;
    perform public.apply_simulated_delta(wallet, quote_asset, notional - fee_amount);
  end if;

  update public.orders
  set status = 'filled',
      price = execution_price,
      filled = fresh.amount,
      remaining = 0,
      fee = fee_amount
  where id = fresh.id;

  insert into public.trades (order_id, user_id, pair_id, side, price, amount, fee)
  values (fresh.id, fresh.user_id, fresh.pair_id, fresh.side, execution_price, fresh.amount, fee_amount);

  insert into public.transactions (user_id, type, asset_id, amount, status, reference, created_by)
  values (fresh.user_id, 'trade', base_asset, fresh.amount, 'completed', fresh.id::text, fresh.user_id);

  if fee_amount > 0 then
    insert into public.transactions (user_id, type, asset_id, amount, status, reference, created_by)
    values (fresh.user_id, 'fee', quote_asset, fee_amount, 'completed', fresh.id::text, fresh.user_id);
  end if;

  insert into public.notifications (user_id, title, body)
  values (
    fresh.user_id,
    'Simulated order filled',
    'A training order was filled at the reference price. This has no monetary value and was not sent to an exchange.'
  );

  return true;
end;
$$;

create or replace function public.assert_trading_actor()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  account_status public.account_status;
begin
  if actor is null then
    raise exception 'Sign in is required.';
  end if;

  select status into account_status
  from public.profiles
  where id = actor;

  if account_status is null then
    raise exception 'No profile exists for this account.';
  end if;
  if account_status = 'suspended' then
    raise exception 'This account is suspended.';
  end if;

  return actor;
end;
$$;

create or replace function public.assert_fresh_quote(quoted_at timestamptz)
returns void
language plpgsql
as $$
begin
  if quoted_at is null
     or quoted_at < now() - interval '10 minutes'
     or quoted_at > now() + interval '2 minutes' then
    raise exception 'The reference price is stale.';
  end if;
end;
$$;

create or replace function public.submit_simulated_order(
  target_pair uuid,
  order_side text,
  order_type text,
  order_amount numeric,
  limit_price numeric,
  stop_price numeric,
  reference_price numeric,
  quoted_at timestamptz,
  request_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  wallet uuid;
  base_asset uuid;
  quote_asset uuid;
  pair_enabled boolean;
  base_enabled boolean;
  quote_enabled boolean;
  minimum numeric;
  rate numeric;
  fee_amount numeric;
  reserve_price numeric;
  reserve_total numeric;
  should_fill boolean := false;
  fill_price numeric;
  resting_status public.order_status;
  order_id uuid;
begin
  actor := public.assert_trading_actor();
  perform public.assert_fresh_quote(quoted_at);

  if request_token is null then
    raise exception 'A request token is required.';
  end if;
  if order_side not in ('buy', 'sell') then
    raise exception 'Choose buy or sell.';
  end if;
  if order_type not in ('market', 'limit', 'stop') then
    raise exception 'Choose a market, limit, or stop order.';
  end if;
  if order_amount is null or order_amount <= 0 then
    raise exception 'Enter an amount greater than zero.';
  end if;
  if order_amount > 1000000000 then
    raise exception 'That amount is too large for a training order.';
  end if;
  if reference_price is null or reference_price <= 0 or reference_price > 1000000000000 then
    raise exception 'A reference price is required.';
  end if;
  if order_type = 'market' and (limit_price is not null or stop_price is not null) then
    raise exception 'A market order does not take a limit or stop price.';
  end if;
  if order_type = 'limit' and (limit_price is null or limit_price <= 0 or limit_price > 1000000000000) then
    raise exception 'Enter a valid limit price.';
  end if;
  if order_type = 'stop' and (stop_price is null or stop_price <= 0 or stop_price > 1000000000000) then
    raise exception 'Enter a valid stop price.';
  end if;
  if order_type = 'limit' and stop_price is not null then
    raise exception 'A limit order does not take a stop price.';
  end if;
  if order_type = 'stop' and limit_price is not null then
    raise exception 'A stop order does not take a limit price.';
  end if;
  if order_amount * reference_price > 1000000000000 then
    raise exception 'That order is too large for a training order.';
  end if;

  select
    pair.base_asset_id,
    pair.quote_asset_id,
    pair.trading_enabled,
    pair.min_order,
    base.trading_enabled,
    quote.trading_enabled
  into base_asset, quote_asset, pair_enabled, minimum, base_enabled, quote_enabled
  from public.trading_pairs as pair
  join public.assets as base on base.id = pair.base_asset_id
  join public.assets as quote on quote.id = pair.quote_asset_id
  where pair.id = target_pair;

  if base_asset is null or pair_enabled is not true or base_enabled is not true or quote_enabled is not true then
    raise exception 'Trading is not open for this pair.';
  end if;
  if minimum > 0 and order_amount < minimum then
    raise exception 'The amount is below the minimum order.';
  end if;

  select id into wallet
  from public.wallets
  where user_id = actor
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  rate := public.taker_fee_rate();
  should_fill := order_type = 'market'
    or (order_type = 'limit' and order_side = 'buy' and reference_price <= limit_price)
    or (order_type = 'limit' and order_side = 'sell' and reference_price >= limit_price)
    or (order_type = 'stop' and order_side = 'buy' and reference_price >= stop_price)
    or (order_type = 'stop' and order_side = 'sell' and reference_price <= stop_price);

  if should_fill then
    fill_price := case when order_type = 'limit' then limit_price else reference_price end;
    fee_amount := fill_price * order_amount * rate;
  else
    reserve_price := case when order_type = 'limit' then limit_price else stop_price end;
    fee_amount := reserve_price * order_amount * rate;
    reserve_total := reserve_price * order_amount + fee_amount;
    if order_side = 'buy' then
      perform public.lock_available(wallet, quote_asset, reserve_total);
    else
      perform public.lock_available(wallet, base_asset, order_amount);
    end if;
  end if;

  resting_status := case when order_type = 'stop' then 'inactive'::public.order_status else 'open'::public.order_status end;

  insert into public.orders (
    user_id, pair_id, side, type, price, stop_price, amount, filled, remaining, status, fee, client_token
  )
  values (
    actor,
    target_pair,
    order_side::public.order_side,
    order_type::public.order_type,
    case when order_type = 'limit' then limit_price else null end,
    case when order_type = 'stop' then stop_price else null end,
    order_amount,
    0,
    order_amount,
    case when should_fill then 'open'::public.order_status else resting_status end,
    fee_amount,
    request_token
  )
  returning id into order_id;

  if should_fill then
    perform public.settle_simulated_order(order_id, fill_price, false);
  else
    insert into public.notifications (user_id, title, body)
    values (
      actor,
      case when order_type = 'stop' then 'Simulated stop order waiting' else 'Simulated order open' end,
      'A training order is resting. It was not sent to an exchange.'
    );
  end if;

  return order_id;
exception
  when unique_violation then
    raise exception 'This order was already submitted.';
end;
$$;

create or replace function public.cancel_simulated_order(target_order uuid)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  fresh public.orders%rowtype;
  wallet uuid;
  base_asset uuid;
  quote_asset uuid;
  reserved numeric;
begin
  actor := public.assert_trading_actor();

  select * into fresh
  from public.orders
  where id = target_order
    and user_id = actor
  for update;

  if fresh.id is null then
    raise exception 'That order does not exist.';
  end if;
  if fresh.status not in ('open', 'inactive') then
    raise exception 'Only an open order can be cancelled.';
  end if;

  select pair.base_asset_id, pair.quote_asset_id
  into base_asset, quote_asset
  from public.trading_pairs as pair
  where pair.id = fresh.pair_id;

  select id into wallet
  from public.wallets
  where user_id = actor
  for update;

  if fresh.side = 'buy' then
    reserved := fresh.amount * coalesce(fresh.price, fresh.stop_price) + fresh.fee;
    perform public.unlock_available(wallet, quote_asset, reserved);
  else
    perform public.unlock_available(wallet, base_asset, fresh.amount);
  end if;

  update public.orders
  set status = 'cancelled',
      remaining = 0
  where id = fresh.id;

  insert into public.notifications (user_id, title, body)
  values (actor, 'Simulated order cancelled', 'The locked training balance was released. Completed fills were not changed.');

  return 'cancelled';
end;
$$;

create or replace function public.process_simulated_orders(
  pair_ids uuid[],
  reference_prices numeric[],
  quoted_at timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  index_position integer;
  fresh public.orders%rowtype;
  filled_count integer := 0;
  reference numeric;
begin
  actor := public.assert_trading_actor();
  perform public.assert_fresh_quote(quoted_at);

  if pair_ids is null or reference_prices is null or cardinality(pair_ids) <> cardinality(reference_prices) then
    raise exception 'Each pair needs one reference price.';
  end if;

  for index_position in 1 .. cardinality(pair_ids) loop
    reference := reference_prices[index_position];
    if pair_ids[index_position] is null or reference is null or reference <= 0 or reference > 1000000000000 then
      continue;
    end if;

    for fresh in
      select *
      from public.orders
      where user_id = actor
        and pair_id = pair_ids[index_position]
        and status in ('open', 'inactive')
      order by created_at
      for update
    loop
      begin
        if fresh.type = 'limit' and fresh.side = 'buy' and fresh.price is not null and reference <= fresh.price
           and public.settle_simulated_order(fresh.id, fresh.price, true) then
          filled_count := filled_count + 1;
        elsif fresh.type = 'limit' and fresh.side = 'sell' and fresh.price is not null and reference >= fresh.price
           and public.settle_simulated_order(fresh.id, fresh.price, true) then
          filled_count := filled_count + 1;
        elsif fresh.type = 'stop' and fresh.side = 'buy' and fresh.stop_price is not null and reference >= fresh.stop_price
           and public.settle_simulated_order(fresh.id, reference, true) then
          filled_count := filled_count + 1;
        elsif fresh.type = 'stop' and fresh.side = 'sell' and fresh.stop_price is not null and reference <= fresh.stop_price
           and public.settle_simulated_order(fresh.id, reference, true) then
          filled_count := filled_count + 1;
        end if;
      exception
        when others then
          if sqlerrm ilike '%Insufficient simulated balance%' or sqlerrm ilike '%Locked balance is short%' then
            null;
          else
            raise;
          end if;
      end;
    end loop;
  end loop;

  return filled_count;
end;
$$;

revoke all on function public.taker_fee_rate() from public, anon, authenticated;
revoke all on function public.lock_available(uuid, uuid, numeric) from public, anon, authenticated;
revoke all on function public.unlock_available(uuid, uuid, numeric) from public, anon, authenticated;
revoke all on function public.consume_locked(uuid, uuid, numeric) from public, anon, authenticated;
revoke all on function public.settle_simulated_order(uuid, numeric, boolean) from public, anon, authenticated;
revoke all on function public.assert_trading_actor() from public, anon, authenticated;
revoke all on function public.assert_fresh_quote(timestamptz) from public, anon, authenticated;
revoke all on function public.submit_simulated_order(uuid, text, text, numeric, numeric, numeric, numeric, timestamptz, uuid) from public, anon;
revoke all on function public.cancel_simulated_order(uuid) from public, anon;
revoke all on function public.process_simulated_orders(uuid[], numeric[], timestamptz) from public, anon;

grant execute on function public.submit_simulated_order(uuid, text, text, numeric, numeric, numeric, numeric, timestamptz, uuid) to authenticated;
grant execute on function public.cancel_simulated_order(uuid) to authenticated;
grant execute on function public.process_simulated_orders(uuid[], numeric[], timestamptz) to authenticated;
