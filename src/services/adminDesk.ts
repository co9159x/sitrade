import { getSupabase } from '@/lib/supabase'

export type AdminProfile = {
  id: string
  fullName: string
  email: string
  status: string
  role: string
  createdAt: string
  updatedAt: string
}

export type AdminAsset = {
  id: string
  symbol: string
  name: string
  providerAssetId: string
  quoteCurrency: string
  listed: boolean
  tradingEnabled: boolean
  depositsEnabled: boolean
  withdrawalsEnabled: boolean
  minOrder: number
  withdrawalFee: number
}

export type AdminPair = {
  id: string
  symbol: string
  baseAssetId: string
  quoteAssetId: string
  tradingEnabled: boolean
  minOrder: number
}

export type AdminBalance = {
  id: string
  userId: string
  symbol: string
  available: number
  locked: number
}

export type AdminDeposit = {
  id: string
  userId: string
  symbol: string
  amount: number
  status: string
  note: string
  createdAt: string
}

export type AdminWithdrawal = {
  id: string
  userId: string
  symbol: string
  amount: number
  fee: number
  destination: string
  status: string
  note: string
  createdAt: string
}

export type AdminOrder = {
  id: string
  userId: string
  pair: string
  side: string
  type: string
  price: number | null
  amount: number
  filled: number
  remaining: number
  status: string
  createdAt: string
}

export type AdminTrade = {
  id: string
  userId: string
  pair: string
  side: string
  price: number
  amount: number
  fee: number
  createdAt: string
}

export type AdminLedger = {
  id: string
  userId: string
  type: string
  symbol: string
  amount: number
  status: string
  createdAt: string
}

export type AdminAudit = {
  id: string
  adminId: string
  action: string
  targetUserId: string
  assetId: string
  previous: string
  next: string
  note: string
  createdAt: string
}

export type AdminSnapshot = {
  profiles: AdminProfile[]
  assets: AdminAsset[]
  pairs: AdminPair[]
  balances: AdminBalance[]
  deposits: AdminDeposit[]
  withdrawals: AdminWithdrawal[]
  orders: AdminOrder[]
  trades: AdminTrade[]
  ledger: AdminLedger[]
  audit: AdminAudit[]
}

type Row = Record<string, unknown>

function asRows(data: unknown) {
  return Array.isArray(data) ? (data as Row[]) : []
}

function related(value: unknown) {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null
  if (value && typeof value === 'object') return value as Row
  return null
}

function text(row: Row | null, key: string, fallback = '') {
  const value = row?.[key]
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function nullableNum(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return num(value)
}

function roleName(value: unknown) {
  const row = related(value)
  const name = text(row, 'name', 'user')
  return name || 'user'
}

async function query(label: string, run: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await run
  if (error) throw new Error(`${label}: ${error.message}`)
  return asRows(data)
}

const limit = 300

export async function loadAdminDesk(): Promise<AdminSnapshot> {
  const supabase = getSupabase()
  const [profiles, assets, pairs, balances, deposits, withdrawals, orders, trades, ledger, audit] = await Promise.all([
    query('Users', supabase.from('profiles').select('id, full_name, email, status, created_at, updated_at, roles(name)').order('created_at', { ascending: false }).limit(limit)),
    query('Assets', supabase.from('assets').select('id, symbol, name, provider_asset_id, quote_currency, listed, trading_enabled, deposits_enabled, withdrawals_enabled, min_order, withdrawal_fee').order('symbol')),
    query('Pairs', supabase.from('trading_pairs').select('id, symbol, base_asset_id, quote_asset_id, trading_enabled, min_order').order('symbol')),
    query('Balances', supabase.from('wallet_balances').select('id, available, locked, wallets(user_id), assets(symbol)').limit(limit)),
    query('Deposits', supabase.from('deposits').select('id, user_id, amount, status, note, created_at, assets(symbol)').order('created_at', { ascending: false }).limit(limit)),
    query('Withdrawals', supabase.from('withdrawals').select('id, user_id, amount, fee, destination, status, note, created_at, assets(symbol)').order('created_at', { ascending: false }).limit(limit)),
    query('Orders', supabase.from('orders').select('id, user_id, side, type, price, amount, filled, remaining, status, created_at, trading_pairs(symbol)').order('created_at', { ascending: false }).limit(limit)),
    query('Trades', supabase.from('trades').select('id, user_id, side, price, amount, fee, created_at, trading_pairs(symbol)').order('created_at', { ascending: false }).limit(limit)),
    query('Ledger', supabase.from('transactions').select('id, user_id, type, amount, status, created_at, assets(symbol)').order('created_at', { ascending: false }).limit(limit)),
    query('Audit', supabase.from('audit_logs').select('id, admin_id, action, target_user_id, asset_id, previous_value, new_value, note, created_at').order('created_at', { ascending: false }).limit(limit)),
  ])

  return {
    profiles: profiles.map((row) => ({
      id: text(row, 'id'),
      fullName: text(row, 'full_name'),
      email: text(row, 'email'),
      status: text(row, 'status'),
      role: roleName(row.roles),
      createdAt: text(row, 'created_at'),
      updatedAt: text(row, 'updated_at'),
    })),
    assets: assets.map((row) => ({
      id: text(row, 'id'),
      symbol: text(row, 'symbol'),
      name: text(row, 'name'),
      providerAssetId: text(row, 'provider_asset_id'),
      quoteCurrency: text(row, 'quote_currency', 'GBP'),
      listed: row.listed === true,
      tradingEnabled: row.trading_enabled === true,
      depositsEnabled: row.deposits_enabled === true,
      withdrawalsEnabled: row.withdrawals_enabled === true,
      minOrder: num(row.min_order),
      withdrawalFee: num(row.withdrawal_fee),
    })),
    pairs: pairs.map((row) => ({
      id: text(row, 'id'),
      symbol: text(row, 'symbol'),
      baseAssetId: text(row, 'base_asset_id'),
      quoteAssetId: text(row, 'quote_asset_id'),
      tradingEnabled: row.trading_enabled === true,
      minOrder: num(row.min_order),
    })),
    balances: balances.map((row) => ({
      id: text(row, 'id'),
      userId: text(related(row.wallets), 'user_id'),
      symbol: text(related(row.assets), 'symbol'),
      available: num(row.available),
      locked: num(row.locked),
    })),
    deposits: deposits.map((row) => ({
      id: text(row, 'id'),
      userId: text(row, 'user_id'),
      symbol: text(related(row.assets), 'symbol', '—'),
      amount: num(row.amount),
      status: text(row, 'status'),
      note: text(row, 'note'),
      createdAt: text(row, 'created_at'),
    })),
    withdrawals: withdrawals.map((row) => ({
      id: text(row, 'id'),
      userId: text(row, 'user_id'),
      symbol: text(related(row.assets), 'symbol', '—'),
      amount: num(row.amount),
      fee: num(row.fee),
      destination: text(row, 'destination'),
      status: text(row, 'status'),
      note: text(row, 'note'),
      createdAt: text(row, 'created_at'),
    })),
    orders: orders.map((row) => ({
      id: text(row, 'id'),
      userId: text(row, 'user_id'),
      pair: text(related(row.trading_pairs), 'symbol', 'Pair'),
      side: text(row, 'side'),
      type: text(row, 'type'),
      price: nullableNum(row.price),
      amount: num(row.amount),
      filled: num(row.filled),
      remaining: num(row.remaining),
      status: text(row, 'status'),
      createdAt: text(row, 'created_at'),
    })),
    trades: trades.map((row) => ({
      id: text(row, 'id'),
      userId: text(row, 'user_id'),
      pair: text(related(row.trading_pairs), 'symbol', 'Pair'),
      side: text(row, 'side'),
      price: num(row.price),
      amount: num(row.amount),
      fee: num(row.fee),
      createdAt: text(row, 'created_at'),
    })),
    ledger: ledger.map((row) => ({
      id: text(row, 'id'),
      userId: text(row, 'user_id'),
      type: text(row, 'type'),
      symbol: text(related(row.assets), 'symbol', '—'),
      amount: num(row.amount),
      status: text(row, 'status'),
      createdAt: text(row, 'created_at'),
    })),
    audit: audit.map((row) => ({
      id: text(row, 'id'),
      adminId: text(row, 'admin_id'),
      action: text(row, 'action'),
      targetUserId: text(row, 'target_user_id'),
      assetId: text(row, 'asset_id'),
      previous: text(row, 'previous_value', '—'),
      next: text(row, 'new_value', '—'),
      note: text(row, 'note', '—'),
      createdAt: text(row, 'created_at'),
    })),
  }
}
