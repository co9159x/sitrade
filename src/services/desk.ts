import { getSupabase } from '@/lib/supabase'

export type DeskAsset = {
  id: string
  symbol: string
  name: string
  providerAssetId: string
  quoteCurrency: string
  tradingEnabled: boolean
  depositsEnabled: boolean
  withdrawalsEnabled: boolean
  withdrawalFee: number
}

export type DeskBalance = {
  id: string
  symbol: string
  name: string
  available: number
  locked: number
}

export type DeskOrder = {
  id: string
  pair: string
  type: string
  side: string
  price: number | null
  amount: number
  filled: number
  remaining: number
  status: string
  fee: number
  createdAt: string
}

export type DeskTrade = {
  id: string
  pair: string
  side: string
  price: number
  amount: number
  fee: number
  createdAt: string
}

export type DeskTransaction = {
  id: string
  type: string
  asset: string
  amount: number
  status: string
  createdAt: string
}

export type DeskNotification = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type DeskWatch = {
  assetId: string
  symbol: string
  name: string
}

export type DeskPair = {
  id: string
  symbol: string
  baseSymbol: string
  quoteSymbol: string
  baseProviderAssetId: string
  quoteProviderAssetId: string
  tradingEnabled: boolean
  minOrder: number
}

export type DeskSnapshot = {
  assets: DeskAsset[]
  pairs: DeskPair[]
  balances: DeskBalance[]
  orders: DeskOrder[]
  trades: DeskTrade[]
  transactions: DeskTransaction[]
  notifications: DeskNotification[]
  watchlist: DeskWatch[]
  feeRate: number | null
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
  const parsed = num(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function query(label: string, run: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await run
  if (error) throw new Error(`${label}: ${error.message}`)
  return asRows(data)
}

async function optionalQuery(run: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  try {
    return await query('Optional', run)
  } catch {
    return [] as Row[]
  }
}

export async function loadDesk(): Promise<DeskSnapshot> {
  const supabase = getSupabase()

  const [assets, balances, orders, trades, transactions, notifications, watchlist, pairs, settings] = await Promise.all([
    query('Assets', supabase.from('assets').select('id, symbol, name, provider_asset_id, quote_currency, trading_enabled, deposits_enabled, withdrawals_enabled, withdrawal_fee, listed').eq('listed', true).order('symbol')),
    query('Balances', supabase.from('wallet_balances').select('id, available, locked, assets(id, symbol, name)')),
    query('Orders', supabase.from('orders').select('id, side, type, price, amount, filled, remaining, status, fee, created_at, trading_pairs(symbol)').order('created_at', { ascending: false }).limit(100)),
    query('Trades', supabase.from('trades').select('id, side, price, amount, fee, created_at, trading_pairs(symbol)').order('created_at', { ascending: false }).limit(300)),
    query('Transactions', supabase.from('transactions').select('id, type, amount, status, created_at, assets(symbol)').order('created_at', { ascending: false }).limit(200)),
    query('Notifications', supabase.from('notifications').select('id, title, body, read, created_at').order('created_at', { ascending: false }).limit(50)),
    query('Watchlist', supabase.from('watchlists').select('asset_id, assets(id, symbol, name)')),
    optionalQuery(supabase.from('trading_pairs').select('id, symbol, trading_enabled, min_order, base:assets!trading_pairs_base_asset_id_fkey(symbol, provider_asset_id), quote:assets!trading_pairs_quote_asset_id_fkey(symbol, provider_asset_id)').eq('trading_enabled', true).order('symbol')),
    optionalQuery(supabase.from('platform_settings').select('taker_fee_rate').limit(1)),
  ])
  const feeValue = settings[0]?.taker_fee_rate
  const feeRate = feeValue === null || feeValue === undefined || feeValue === '' ? null : num(feeValue)

  return {
    pairs: pairs.flatMap((row) => {
      const base = related(row.base)
      const quote = related(row.quote)
      const id = text(row, 'id')
      if (!id || !base || !quote) return []
      return [{
        id,
        symbol: text(row, 'symbol'),
        baseSymbol: text(base, 'symbol'),
        quoteSymbol: text(quote, 'symbol'),
        baseProviderAssetId: text(base, 'provider_asset_id'),
        quoteProviderAssetId: text(quote, 'provider_asset_id'),
        tradingEnabled: row.trading_enabled === true,
        minOrder: num(row.min_order),
      }]
    }),
    feeRate: Number.isFinite(feeRate) ? feeRate : null,
    assets: assets.map((row) => ({
      id: text(row, 'id'),
      symbol: text(row, 'symbol'),
      name: text(row, 'name'),
      providerAssetId: text(row, 'provider_asset_id'),
      quoteCurrency: text(row, 'quote_currency', 'GBP'),
      tradingEnabled: row.trading_enabled === true,
      depositsEnabled: row.deposits_enabled === true,
      withdrawalsEnabled: row.withdrawals_enabled === true,
      withdrawalFee: num(row.withdrawal_fee),
    })),
    balances: balances.map((row) => {
      const asset = related(row.assets)
      return {
        id: text(row, 'id'),
        symbol: text(asset, 'symbol', 'Unknown'),
        name: text(asset, 'name'),
        available: num(row.available),
        locked: num(row.locked),
      }
    }),
    orders: orders.map((row) => ({
      id: text(row, 'id'),
      pair: text(related(row.trading_pairs), 'symbol', 'Pair'),
      type: text(row, 'type'),
      side: text(row, 'side'),
      price: nullableNum(row.price),
      amount: num(row.amount),
      filled: num(row.filled),
      remaining: num(row.remaining),
      status: text(row, 'status'),
      fee: num(row.fee),
      createdAt: text(row, 'created_at'),
    })),
    trades: trades.map((row) => ({
      id: text(row, 'id'),
      pair: text(related(row.trading_pairs), 'symbol', 'Pair'),
      side: text(row, 'side'),
      price: num(row.price),
      amount: num(row.amount),
      fee: num(row.fee),
      createdAt: text(row, 'created_at'),
    })),
    transactions: transactions.map((row) => ({
      id: text(row, 'id'),
      type: text(row, 'type'),
      asset: text(related(row.assets), 'symbol', '—'),
      amount: num(row.amount),
      status: text(row, 'status'),
      createdAt: text(row, 'created_at'),
    })),
    notifications: notifications.map((row) => ({
      id: text(row, 'id'),
      title: text(row, 'title'),
      body: text(row, 'body'),
      read: row.read === true,
      createdAt: text(row, 'created_at'),
    })),
    watchlist: watchlist.map((row) => {
      const asset = related(row.assets)
      return {
        assetId: text(row, 'asset_id') || text(asset, 'id'),
        symbol: text(asset, 'symbol'),
        name: text(asset, 'name'),
      }
    }),
  }
}
