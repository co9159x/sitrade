-- Security hardening.
-- Clients may read their own rows. Money, ledger, and audit rows change only
-- through security-definer functions, which run as the function owner.
-- A profile update from the client can change the display name, phone, and avatar only.

create or replace function public.reject_client_ledger_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    raise exception 'This record cannot be changed from the client.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.reject_audit_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Audit records cannot be changed.';
end;
$$;

drop trigger if exists wallets_reject_client_write on public.wallets;
create trigger wallets_reject_client_write before insert or update or delete on public.wallets
for each row execute function public.reject_client_ledger_write();

drop trigger if exists wallet_balances_reject_client_write on public.wallet_balances;
create trigger wallet_balances_reject_client_write before insert or update or delete on public.wallet_balances
for each row execute function public.reject_client_ledger_write();

drop trigger if exists orders_reject_client_write on public.orders;
create trigger orders_reject_client_write before insert or update or delete on public.orders
for each row execute function public.reject_client_ledger_write();

drop trigger if exists trades_reject_client_write on public.trades;
create trigger trades_reject_client_write before insert or update or delete on public.trades
for each row execute function public.reject_client_ledger_write();

drop trigger if exists transactions_reject_client_write on public.transactions;
create trigger transactions_reject_client_write before insert or update or delete on public.transactions
for each row execute function public.reject_client_ledger_write();

drop trigger if exists deposits_reject_client_write on public.deposits;
create trigger deposits_reject_client_write before insert or update or delete on public.deposits
for each row execute function public.reject_client_ledger_write();

drop trigger if exists withdrawals_reject_client_write on public.withdrawals;
create trigger withdrawals_reject_client_write before insert or update or delete on public.withdrawals
for each row execute function public.reject_client_ledger_write();

drop trigger if exists assets_reject_client_write on public.assets;
create trigger assets_reject_client_write before insert or update or delete on public.assets
for each row execute function public.reject_client_ledger_write();

drop trigger if exists trading_pairs_reject_client_write on public.trading_pairs;
create trigger trading_pairs_reject_client_write before insert or update or delete on public.trading_pairs
for each row execute function public.reject_client_ledger_write();

drop trigger if exists platform_settings_reject_client_write on public.platform_settings;
create trigger platform_settings_reject_client_write before insert or update or delete on public.platform_settings
for each row execute function public.reject_client_ledger_write();

drop trigger if exists notifications_reject_client_write on public.notifications;
create trigger notifications_reject_client_write before insert or update or delete on public.notifications
for each row execute function public.reject_client_ledger_write();

drop trigger if exists admin_actions_reject_client_write on public.admin_actions;
create trigger admin_actions_reject_client_write before insert or update or delete on public.admin_actions
for each row execute function public.reject_client_ledger_write();

drop trigger if exists audit_logs_reject_client_write on public.audit_logs;
create trigger audit_logs_reject_client_write before insert or update or delete on public.audit_logs
for each row execute function public.reject_client_ledger_write();

drop trigger if exists roles_reject_client_write on public.roles;
create trigger roles_reject_client_write before insert or update or delete on public.roles
for each row execute function public.reject_client_ledger_write();

drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function public.reject_audit_change();

revoke insert, update, delete on table
  public.wallets,
  public.wallet_balances,
  public.orders,
  public.trades,
  public.transactions,
  public.deposits,
  public.withdrawals,
  public.assets,
  public.trading_pairs,
  public.platform_settings,
  public.notifications,
  public.admin_actions,
  public.audit_logs,
  public.roles
from anon, authenticated;

revoke update on table public.watchlists from anon, authenticated;
revoke all on table
  public.wallets,
  public.wallet_balances,
  public.orders,
  public.trades,
  public.transactions,
  public.deposits,
  public.withdrawals,
  public.assets,
  public.trading_pairs,
  public.platform_settings,
  public.notifications,
  public.admin_actions,
  public.audit_logs,
  public.roles,
  public.profiles,
  public.watchlists
from anon;

revoke update on table public.profiles from authenticated;
grant update (full_name, phone, avatar_url) on table public.profiles to authenticated;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.reject_client_ledger_write() from public, anon, authenticated;
revoke all on function public.reject_audit_change() from public, anon, authenticated;
