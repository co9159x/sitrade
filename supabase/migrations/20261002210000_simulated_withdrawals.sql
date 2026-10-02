-- Simulated withdrawals.
-- A request locks the amount and network fee. An administrator completes or rejects it.
-- No blockchain transaction is created.

alter table public.withdrawals
  add column client_token uuid;

create unique index withdrawals_client_token_idx
  on public.withdrawals (client_token)
  where client_token is not null;

update public.assets
set
  withdrawals_enabled = true,
  withdrawal_fee = case symbol
    when 'BTC' then 0.0001
    when 'ETH' then 0.001
    when 'SOL' then 0.01
    when 'XRP' then 0.2
    when 'ADA' then 1
    when 'DOGE' then 2
    when 'USDT' then 1
    when 'BNB' then 0.001
    when 'AVAX' then 0.02
    when 'DOT' then 0.1
    when 'LINK' then 0.05
    else withdrawal_fee
  end
where symbol in ('BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'USDT', 'BNB', 'AVAX', 'DOT', 'LINK');

create or replace function public.submit_simulated_withdrawal(
  target_asset uuid,
  withdrawal_amount numeric,
  destination_reference text,
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
  withdrawal_id uuid;
  account_status public.account_status;
  asset_open boolean;
  network_fee numeric;
  clean_destination text := btrim(coalesce(destination_reference, ''));
  reserved numeric;
begin
  if actor is null then
    raise exception 'Sign in is required.';
  end if;
  if request_token is null then
    raise exception 'A request token is required.';
  end if;
  if withdrawal_amount is null or withdrawal_amount <= 0 then
    raise exception 'Enter an amount greater than zero.';
  end if;
  if withdrawal_amount > 1000000000 then
    raise exception 'That amount is too large for a training withdrawal.';
  end if;
  if char_length(clean_destination) < 3 or char_length(clean_destination) > 120 then
    raise exception 'Enter a destination reference between 3 and 120 characters.';
  end if;
  if clean_destination ~ '[[:cntrl:]]' then
    raise exception 'Enter a valid destination reference.';
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

  select withdrawals_enabled, withdrawal_fee
  into asset_open, network_fee
  from public.assets
  where id = target_asset;

  if asset_open is null or asset_open is not true then
    raise exception 'Withdrawals are not open for this asset.';
  end if;

  network_fee := coalesce(network_fee, 0);
  reserved := withdrawal_amount + network_fee;

  select id into wallet
  from public.wallets
  where user_id = actor
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  perform public.lock_available(wallet, target_asset, reserved);

  insert into public.withdrawals (user_id, asset_id, amount, fee, destination, status, note, client_token)
  values (actor, target_asset, withdrawal_amount, network_fee, clean_destination, 'pending', 'Simulated withdrawal', request_token)
  returning id into withdrawal_id;

  insert into public.transactions (user_id, type, asset_id, amount, status, reference, created_by)
  values (actor, 'withdrawal', target_asset, withdrawal_amount, 'pending', withdrawal_id::text, actor);

  insert into public.notifications (user_id, title, body)
  values (
    actor,
    'Simulated withdrawal requested',
    'The training amount is locked until review. Nothing was sent to a blockchain or bank.'
  );

  return withdrawal_id;
exception
  when unique_violation then
    raise exception 'This withdrawal was already submitted.';
end;
$$;

create or replace function public.admin_review_withdrawal(
  target_withdrawal uuid,
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
  fresh public.withdrawals%rowtype;
  wallet uuid;
  clean_note text := btrim(coalesce(review_note, ''));
  reserved numeric;
  next_status public.ledger_status;
begin
  if actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;
  if decision not in ('processing', 'approve', 'reject') then
    raise exception 'Choose processing, approve, or reject.';
  end if;
  if char_length(clean_note) < 3 or char_length(clean_note) > 280 then
    raise exception 'Enter a note between 3 and 280 characters.';
  end if;

  select * into fresh
  from public.withdrawals
  where id = target_withdrawal
  for update;

  if fresh.id is null then
    raise exception 'That withdrawal does not exist.';
  end if;
  if fresh.status not in ('pending', 'processing') then
    raise exception 'Only a pending or processing withdrawal can be reviewed.';
  end if;
  if decision = 'processing' and fresh.status <> 'pending' then
    raise exception 'Only a pending withdrawal can be marked processing.';
  end if;

  select id into wallet
  from public.wallets
  where user_id = fresh.user_id
  for update;

  if wallet is null then
    raise exception 'No wallet exists for this account.';
  end if;

  reserved := fresh.amount + fresh.fee;

  if decision = 'processing' then
    next_status := 'processing';
    update public.withdrawals
    set status = 'processing',
        note = clean_note
    where id = fresh.id;

    update public.transactions
    set status = 'processing'
    where user_id = fresh.user_id
      and type = 'withdrawal'
      and reference = fresh.id::text
      and status = 'pending';
  elsif decision = 'approve' then
    next_status := 'completed';
    perform public.consume_locked(wallet, fresh.asset_id, reserved);

    update public.withdrawals
    set status = 'completed',
        note = clean_note
    where id = fresh.id;

    update public.transactions
    set status = 'completed'
    where user_id = fresh.user_id
      and type = 'withdrawal'
      and reference = fresh.id::text
      and status in ('pending', 'processing');
  else
    next_status := 'rejected';
    perform public.unlock_available(wallet, fresh.asset_id, reserved);

    update public.withdrawals
    set status = 'rejected',
        note = clean_note
    where id = fresh.id;

    update public.transactions
    set status = 'rejected'
    where user_id = fresh.user_id
      and type = 'withdrawal'
      and reference = fresh.id::text
      and status in ('pending', 'processing');
  end if;

  insert into public.audit_logs (admin_id, action, target_user_id, asset_id, previous_value, new_value, note)
  values (actor, 'withdrawal_' || decision, fresh.user_id, fresh.asset_id, fresh.status::text, next_status::text, clean_note);

  insert into public.admin_actions (admin_id, action, target_user_id, note)
  values (actor, 'withdrawal_' || decision, fresh.user_id, clean_note);

  insert into public.notifications (user_id, title, body)
  values (
    fresh.user_id,
    case
      when decision = 'approve' then 'Simulated withdrawal completed'
      when decision = 'reject' then 'Simulated withdrawal rejected'
      else 'Simulated withdrawal processing'
    end,
    case
      when decision = 'approve' then 'A training withdrawal was marked completed. No blockchain transaction was created.'
      when decision = 'reject' then 'A training withdrawal was rejected and the locked balance was released.'
      else 'A training withdrawal is marked processing. Nothing has been sent to a network.'
    end
  );

  return next_status;
end;
$$;

revoke all on function public.submit_simulated_withdrawal(uuid, numeric, text, uuid) from public, anon;
revoke all on function public.admin_review_withdrawal(uuid, text, text) from public, anon;

grant execute on function public.submit_simulated_withdrawal(uuid, numeric, text, uuid) to authenticated;
grant execute on function public.admin_review_withdrawal(uuid, text, text) to authenticated;
