-- Admin operations. Sensitive changes are written with an audit log.
-- Delisting keeps historical trades, orders, and ledger rows.
-- A normal administrator cannot grant the super administrator role.

create or replace function public.is_super_admin()
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
      and role.name = 'super_admin'
  );
$$;

alter table public.platform_settings
  add column if not exists maker_fee_rate numeric(12, 8) not null default 0.001 check (maker_fee_rate >= 0 and maker_fee_rate < 1);

create or replace function public.admin_set_account_status(
  target_user uuid,
  next_status text,
  review_note text
)
returns public.account_status
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current_status public.account_status;
  role_name text;
  clean_note text := btrim(coalesce(review_note, ''));
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if target_user = actor then
    raise exception 'You cannot change your own account status.';
  end if;
  if next_status not in ('active', 'suspended') then
    raise exception 'Choose active or suspended.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select profile.status, role.name
  into current_status, role_name
  from public.profiles as profile
  join public.roles as role on role.id = profile.role_id
  where profile.id = target_user;

  if current_status is null then
    raise exception 'That user does not exist.';
  end if;
  if role_name = 'super_admin' then
    raise exception 'A super administrator status is not changed here.';
  end if;
  if not public.is_super_admin() and role_name <> 'user' then
    raise exception 'An administrator can only change a training user.';
  end if;
  if current_status::text = next_status then
    raise exception 'The account already has that status.';
  end if;

  update public.profiles
  set status = next_status::public.account_status
  where id = target_user;

  insert into public.audit_logs (admin_id, action, target_user_id, previous_value, new_value, note)
  values (
    actor,
    case when next_status = 'suspended' then 'user_suspended' else 'user_reactivated' end,
    target_user,
    current_status::text,
    next_status,
    clean_note
  );

  insert into public.admin_actions (admin_id, action, target_user_id, note)
  values (
    actor,
    case when next_status = 'suspended' then 'user_suspended' else 'user_reactivated' end,
    target_user,
    clean_note
  );

  insert into public.notifications (user_id, title, body)
  values (
    target_user,
    case when next_status = 'suspended' then 'Training account suspended' else 'Training account reactivated' end,
    'An administrator changed the account status. This has no effect outside the training desk.'
  );

  return next_status::public.account_status;
end;
$$;

create or replace function public.admin_set_asset_state(
  target_asset uuid,
  asset_action text,
  review_note text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  asset public.assets%rowtype;
  clean_note text := btrim(coalesce(review_note, ''));
  previous_value text;
  next_value text;
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if asset_action not in (
    'list', 'delist', 'enable_trading', 'disable_trading',
    'enable_deposits', 'disable_deposits', 'enable_withdrawals', 'disable_withdrawals'
  ) then
    raise exception 'Choose a catalogue action.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select * into asset
  from public.assets
  where id = target_asset
  for update;

  if asset.id is null then
    raise exception 'That asset does not exist.';
  end if;

  previous_value := format(
    'listed=%s;trading=%s;deposits=%s;withdrawals=%s',
    case when asset.listed then 'true' else 'false' end,
    case when asset.trading_enabled then 'true' else 'false' end,
    case when asset.deposits_enabled then 'true' else 'false' end,
    case when asset.withdrawals_enabled then 'true' else 'false' end
  );

  if asset_action = 'list' then
    update public.assets set listed = true where id = asset.id;
  elsif asset_action = 'delist' then
    update public.assets
    set listed = false,
        trading_enabled = false,
        deposits_enabled = false,
        withdrawals_enabled = false
    where id = asset.id;
  elsif asset_action = 'enable_trading' then
    update public.assets set trading_enabled = true where id = asset.id;
  elsif asset_action = 'disable_trading' then
    update public.assets set trading_enabled = false where id = asset.id;
  elsif asset_action = 'enable_deposits' then
    update public.assets set deposits_enabled = true where id = asset.id;
  elsif asset_action = 'disable_deposits' then
    update public.assets set deposits_enabled = false where id = asset.id;
  elsif asset_action = 'enable_withdrawals' then
    update public.assets set withdrawals_enabled = true where id = asset.id;
  else
    update public.assets set withdrawals_enabled = false where id = asset.id;
  end if;

  select format(
    'listed=%s;trading=%s;deposits=%s;withdrawals=%s',
    case when listed then 'true' else 'false' end,
    case when trading_enabled then 'true' else 'false' end,
    case when deposits_enabled then 'true' else 'false' end,
    case when withdrawals_enabled then 'true' else 'false' end
  )
  into next_value
  from public.assets
  where id = asset.id;

  insert into public.audit_logs (admin_id, action, asset_id, previous_value, new_value, note)
  values (actor, 'asset_' || asset_action, asset.id, previous_value, next_value, clean_note);

  insert into public.admin_actions (admin_id, action, note)
  values (actor, 'asset_' || asset_action, clean_note);

  return next_value;
end;
$$;

create or replace function public.admin_update_asset_terms(
  target_asset uuid,
  next_min_order numeric,
  next_withdrawal_fee numeric,
  review_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  asset public.assets%rowtype;
  clean_note text := btrim(coalesce(review_note, ''));
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if next_min_order is null or next_min_order < 0 or next_withdrawal_fee is null or next_withdrawal_fee < 0 then
    raise exception 'Minimum order and withdrawal fee cannot be negative.';
  end if;
  if next_min_order > 1000000000 or next_withdrawal_fee > 1000000000 then
    raise exception 'That value is too large for a training asset.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select * into asset from public.assets where id = target_asset for update;
  if asset.id is null then
    raise exception 'That asset does not exist.';
  end if;

  update public.assets
  set min_order = next_min_order,
      withdrawal_fee = next_withdrawal_fee
  where id = asset.id;

  insert into public.audit_logs (admin_id, action, asset_id, previous_value, new_value, note)
  values (
    actor,
    'asset_terms_updated',
    asset.id,
    format('min_order=%s;withdrawal_fee=%s', asset.min_order, asset.withdrawal_fee),
    format('min_order=%s;withdrawal_fee=%s', next_min_order, next_withdrawal_fee),
    clean_note
  );

  insert into public.admin_actions (admin_id, action, note)
  values (actor, 'asset_terms_updated', clean_note);
end;
$$;

create or replace function public.admin_cancel_order(
  target_order uuid,
  review_note text
)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  fresh public.orders%rowtype;
  wallet uuid;
  base_asset uuid;
  quote_asset uuid;
  reserved numeric;
  clean_note text := btrim(coalesce(review_note, ''));
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select * into fresh
  from public.orders
  where id = target_order
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
  where user_id = fresh.user_id
  for update;

  if wallet is null then
    raise exception 'That user has no training wallet.';
  end if;

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

  insert into public.audit_logs (admin_id, action, target_user_id, previous_value, new_value, note)
  values (actor, 'order_cancelled', fresh.user_id, fresh.status::text, 'cancelled', clean_note);

  insert into public.admin_actions (admin_id, action, target_user_id, note)
  values (actor, 'order_cancelled', fresh.user_id, clean_note);

  insert into public.notifications (user_id, title, body)
  values (fresh.user_id, 'Simulated order cancelled', 'An administrator cancelled an open training order and released the locked balance.');

  return 'cancelled';
end;
$$;

create or replace function public.super_admin_set_role(
  target_user uuid,
  next_role text,
  review_note text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current_role text;
  clean_note text := btrim(coalesce(review_note, ''));
  role_id uuid;
begin
  if actor is null or not public.is_super_admin() then
    raise exception 'Super administrator access is required.';
  end if;
  if target_user = actor then
    raise exception 'You cannot change your own role.';
  end if;
  if next_role not in ('user', 'admin') then
    raise exception 'Choose user or admin. The super administrator role is not granted here.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select role.name into current_role
  from public.profiles as profile
  join public.roles as role on role.id = profile.role_id
  where profile.id = target_user;

  if current_role is null then
    raise exception 'That user does not exist.';
  end if;
  if current_role = 'super_admin' then
    raise exception 'A super administrator role is not changed here.';
  end if;
  if current_role = next_role then
    raise exception 'The account already has that role.';
  end if;

  select id into role_id from public.roles where name = next_role::public.user_role;
  update public.profiles set role_id = role_id where id = target_user;

  insert into public.audit_logs (admin_id, action, target_user_id, previous_value, new_value, note)
  values (actor, 'role_changed', target_user, current_role, next_role, clean_note);

  insert into public.admin_actions (admin_id, action, target_user_id, note)
  values (actor, 'role_changed', target_user, clean_note);

  return next_role;
end;
$$;

create or replace function public.super_admin_set_fees(
  next_taker_fee numeric,
  next_maker_fee numeric,
  review_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  previous_taker numeric;
  previous_maker numeric;
  clean_note text := btrim(coalesce(review_note, ''));
begin
  if actor is null or not public.is_super_admin() then
    raise exception 'Super administrator access is required.';
  end if;
  if next_taker_fee is null or next_maker_fee is null
     or next_taker_fee < 0 or next_maker_fee < 0
     or next_taker_fee >= 1 or next_maker_fee >= 1 then
    raise exception 'Enter a fee rate from 0 up to, but not including, 1.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select taker_fee_rate, maker_fee_rate
  into previous_taker, previous_maker
  from public.platform_settings
  where id = 1
  for update;

  update public.platform_settings
  set taker_fee_rate = next_taker_fee,
      maker_fee_rate = next_maker_fee
  where id = 1;

  insert into public.audit_logs (admin_id, action, previous_value, new_value, note)
  values (
    actor,
    'fees_updated',
    format('taker=%s;maker=%s', previous_taker, previous_maker),
    format('taker=%s;maker=%s', next_taker_fee, next_maker_fee),
    clean_note
  );

  insert into public.admin_actions (admin_id, action, note)
  values (actor, 'fees_updated', clean_note);
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
  pair_open boolean;
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

    select
      pair.trading_enabled
      and base.listed
      and quote.listed
      and base.trading_enabled
      and quote.trading_enabled
    into pair_open
    from public.trading_pairs as pair
    join public.assets as base on base.id = pair.base_asset_id
    join public.assets as quote on quote.id = pair.quote_asset_id
    where pair.id = pair_ids[index_position];

    if pair_open is not true then
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

create or replace function public.reject_closed_market_order()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.trading_pairs as pair
    join public.assets as base on base.id = pair.base_asset_id
    join public.assets as quote on quote.id = pair.quote_asset_id
    where pair.id = new.pair_id
      and pair.trading_enabled
      and base.listed
      and quote.listed
      and base.trading_enabled
      and quote.trading_enabled
  ) then
    raise exception 'Trading is not open for this pair.';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_reject_closed_market on public.orders;
create trigger orders_reject_closed_market
before insert on public.orders
for each row execute function public.reject_closed_market_order();

revoke all on function public.reject_closed_market_order() from public, anon, authenticated;
revoke all on function public.is_super_admin() from public, anon, authenticated;
revoke all on function public.admin_set_account_status(uuid, text, text) from public, anon;
revoke all on function public.admin_set_asset_state(uuid, text, text) from public, anon;
revoke all on function public.admin_update_asset_terms(uuid, numeric, numeric, text) from public, anon;
revoke all on function public.admin_cancel_order(uuid, text) from public, anon;
revoke all on function public.super_admin_set_role(uuid, text, text) from public, anon;
revoke all on function public.super_admin_set_fees(numeric, numeric, text) from public, anon;

grant execute on function public.admin_set_account_status(uuid, text, text) to authenticated;
grant execute on function public.admin_set_asset_state(uuid, text, text) to authenticated;
grant execute on function public.admin_update_asset_terms(uuid, numeric, numeric, text) to authenticated;
grant execute on function public.admin_cancel_order(uuid, text) to authenticated;
grant execute on function public.super_admin_set_role(uuid, text, text) to authenticated;
grant execute on function public.super_admin_set_fees(numeric, numeric, text) to authenticated;
