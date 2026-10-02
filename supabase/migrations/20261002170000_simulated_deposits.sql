-- Simulated deposits and audited balance changes.
-- User deposits credit immediately. Pending deposits can still be approved or rejected by an admin.
-- No payment provider is involved.

alter table public.deposits
  add column client_token uuid;

create unique index deposits_client_token_idx
  on public.deposits (client_token)
  where client_token is not null;

update public.assets
set deposits_enabled = true
where symbol in ('BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'USDT', 'BNB', 'AVAX', 'DOT', 'LINK');

create or replace function public.apply_simulated_delta(
  target_wallet uuid,
  target_asset uuid,
  delta numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  next_available numeric;
begin
  if delta = 0 then
    raise exception 'Amount cannot be zero.';
  end if;

  if delta > 0 then
    insert into public.wallet_balances (wallet_id, asset_id, available, locked)
    values (target_wallet, target_asset, delta, 0)
    on conflict (wallet_id, asset_id)
    do update set available = public.wallet_balances.available + excluded.available
    returning available into next_available;
    return next_available;
  end if;

  select available into next_available
  from public.wallet_balances
  where wallet_id = target_wallet
    and asset_id = target_asset
  for update;

  if next_available is null or next_available < abs(delta) then
    raise exception 'Insufficient simulated balance.';
  end if;

  update public.wallet_balances
  set available = available + delta
  where wallet_id = target_wallet
    and asset_id = target_asset
  returning available into next_available;

  return next_available;
end;
$$;

create or replace function public.submit_simulated_deposit(
  target_asset uuid,
  deposit_amount numeric,
  request_token uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  wallet uuid;
  deposit_id uuid;
  account_status public.account_status;
begin
  if actor is null then
    raise exception 'Sign in is required.';
  end if;
  if request_token is null then
    raise exception 'A request token is required.';
  end if;
  if deposit_amount is null or deposit_amount <= 0 then
    raise exception 'Enter an amount greater than zero.';
  end if;
  if deposit_amount > 1000000000 then
    raise exception 'That amount is too large for a training deposit.';
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

  if not exists (
    select 1 from public.assets
    where id = target_asset
      and deposits_enabled = true
  ) then
    raise exception 'Deposits are not open for this asset.';
  end if;

  select id into wallet
  from public.wallets
  where user_id = actor
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  perform public.apply_simulated_delta(wallet, target_asset, deposit_amount);

  insert into public.deposits (user_id, asset_id, amount, status, note, client_token)
  values (actor, target_asset, deposit_amount, 'completed', 'Simulated deposit', request_token)
  returning id into deposit_id;

  insert into public.transactions (user_id, type, asset_id, amount, status, reference, created_by)
  values (actor, 'deposit', target_asset, deposit_amount, 'completed', deposit_id::text, actor);

  insert into public.notifications (user_id, title, body)
  values (
    actor,
    'Simulated deposit credited',
    'A training balance was increased. This has no monetary value.'
  );

  return deposit_id;
exception
  when unique_violation then
    raise exception 'This deposit was already submitted.';
end;
$$;

create or replace function public.admin_adjust_balance(
  target_user uuid,
  target_asset uuid,
  adjustment_amount numeric,
  direction text,
  adjustment_note text
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  wallet uuid;
  previous_available numeric := 0;
  next_available numeric;
  signed_delta numeric;
  clean_note text := btrim(coalesce(adjustment_note, ''));
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if target_user is null or target_asset is null then
    raise exception 'Choose a user and an asset.';
  end if;
  if direction not in ('add', 'remove') then
    raise exception 'Choose add or remove.';
  end if;
  if adjustment_amount is null or adjustment_amount <= 0 then
    raise exception 'Enter an amount greater than zero.';
  end if;
  if adjustment_amount > 1000000000 then
    raise exception 'That amount is too large for a training adjustment.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;
  if not exists (select 1 from public.profiles where id = target_user) then
    raise exception 'That user does not exist.';
  end if;
  if not exists (select 1 from public.assets where id = target_asset) then
    raise exception 'That asset does not exist.';
  end if;

  select id into wallet
  from public.wallets
  where user_id = target_user
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  select available into previous_available
  from public.wallet_balances
  where wallet_id = wallet
    and asset_id = target_asset;

  previous_available := coalesce(previous_available, 0);
  signed_delta := case when direction = 'add' then adjustment_amount else -adjustment_amount end;
  next_available := public.apply_simulated_delta(wallet, target_asset, signed_delta);

  insert into public.transactions (user_id, type, asset_id, amount, status, reference, created_by)
  values (target_user, 'admin_adjustment', target_asset, adjustment_amount, 'completed', direction, actor);

  insert into public.audit_logs (admin_id, action, target_user_id, asset_id, previous_value, new_value, note)
  values (
    actor,
    case when direction = 'add' then 'balance_added' else 'balance_removed' end,
    target_user,
    target_asset,
    previous_available::text,
    next_available::text,
    clean_note
  );

  insert into public.admin_actions (admin_id, action, target_user_id, note)
  values (
    actor,
    case when direction = 'add' then 'balance_added' else 'balance_removed' end,
    target_user,
    clean_note
  );

  insert into public.notifications (user_id, title, body)
  values (
    target_user,
    'Simulated balance adjusted',
    'An administrator changed a training balance. This has no monetary value.'
  );

  return next_available;
end;
$$;

create or replace function public.admin_review_deposit(
  target_deposit uuid,
  decision text,
  review_note text
)
returns public.ledger_status
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  deposit_row public.deposits%rowtype;
  wallet uuid;
  previous_available numeric := 0;
  next_available numeric;
  clean_note text := btrim(coalesce(review_note, ''));
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if decision not in ('approve', 'reject') then
    raise exception 'Choose approve or reject.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select * into deposit_row
  from public.deposits
  where id = target_deposit
  for update;

  if deposit_row.id is null then
    raise exception 'That deposit does not exist.';
  end if;
  if deposit_row.status <> 'pending' then
    raise exception 'Only a pending deposit can be reviewed.';
  end if;

  if decision = 'reject' then
    update public.deposits
    set status = 'rejected',
        note = clean_note
    where id = deposit_row.id;

    insert into public.audit_logs (admin_id, action, target_user_id, asset_id, previous_value, new_value, note)
    values (actor, 'deposit_rejected', deposit_row.user_id, deposit_row.asset_id, 'pending', 'rejected', clean_note);

    insert into public.admin_actions (admin_id, action, target_user_id, note)
    values (actor, 'deposit_rejected', deposit_row.user_id, clean_note);

    insert into public.notifications (user_id, title, body)
    values (deposit_row.user_id, 'Simulated deposit rejected', 'A pending training deposit was rejected. No balance changed.');

    return 'rejected';
  end if;

  select id into wallet
  from public.wallets
  where user_id = deposit_row.user_id
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  select available into previous_available
  from public.wallet_balances
  where wallet_id = wallet
    and asset_id = deposit_row.asset_id;

  next_available := public.apply_simulated_delta(wallet, deposit_row.asset_id, deposit_row.amount);

  update public.deposits
  set status = 'completed',
      note = clean_note
  where id = deposit_row.id;

  insert into public.transactions (user_id, type, asset_id, amount, status, reference, created_by)
  values (deposit_row.user_id, 'deposit', deposit_row.asset_id, deposit_row.amount, 'completed', deposit_row.id::text, actor);

  insert into public.audit_logs (admin_id, action, target_user_id, asset_id, previous_value, new_value, note)
  values (
    actor,
    'deposit_approved',
    deposit_row.user_id,
    deposit_row.asset_id,
    coalesce(previous_available, 0)::text,
    next_available::text,
    clean_note
  );

  insert into public.admin_actions (admin_id, action, target_user_id, note)
  values (actor, 'deposit_approved', deposit_row.user_id, clean_note);

  insert into public.notifications (user_id, title, body)
  values (deposit_row.user_id, 'Simulated deposit approved', 'A pending training deposit was credited. This has no monetary value.');

  return 'completed';
end;
$$;

revoke all on function public.apply_simulated_delta(uuid, uuid, numeric) from public, anon, authenticated;
revoke all on function public.submit_simulated_deposit(uuid, numeric, uuid) from public, anon;
revoke all on function public.admin_adjust_balance(uuid, uuid, numeric, text, text) from public, anon;
revoke all on function public.admin_review_deposit(uuid, text, text) from public, anon;

grant execute on function public.submit_simulated_deposit(uuid, numeric, uuid) to authenticated;
grant execute on function public.admin_adjust_balance(uuid, uuid, numeric, text, text) to authenticated;
grant execute on function public.admin_review_deposit(uuid, text, text) to authenticated;
