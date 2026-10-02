import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import { maxTrainingAmount, validateTrainingAmount } from '@/services/wallet'

export type OrderTypeName = 'market' | 'limit' | 'stop'
export type OrderSideName = 'buy' | 'sell'

export function requestDeskRefresh() {
  window.dispatchEvent(new Event('sitrade-desk-refresh'))
}

export function validateOrderPrice(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return 'Enter a price.'
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return 'Enter a valid price.'
  if (value === 0) return 'Enter a price greater than zero.'
  if (value < 0) return 'Price cannot be negative.'
  if (value > 1_000_000_000_000) return 'That price is too large for a training order.'
  return null
}

export function validateOrderInput(input: { amount: string; price: string; orderType: OrderTypeName; referencePrice: number | null }) {
  const amountError = validateTrainingAmount(input.amount)
  if (amountError) return amountError.replace('training deposit', 'training order')
  const amount = Number(input.amount)
  if (input.orderType !== 'market') {
    const priceError = validateOrderPrice(input.price)
    if (priceError) return priceError
    if (amount * Number(input.price) > maxTrainingAmount) return 'That order is too large for a training order.'
  }
  if (input.referencePrice === null || !Number.isFinite(input.referencePrice) || input.referencePrice <= 0) {
    return 'A reference price is required.'
  }
  if (amount * input.referencePrice > maxTrainingAmount) return 'That order is too large for a training order.'
  return null
}

export function crossPrice(base: number | null | undefined, quote: number | null | undefined) {
  if (base == null || quote == null || !Number.isFinite(base) || !Number.isFinite(quote) || quote <= 0) return null
  return base / quote
}

function rpcError(error: { message: string }) {
  const message = error.message.replace(/^.*Exception:\s*/i, '')
  return message || 'The order was rejected.'
}

export async function submitSimulatedOrder(input: {
  pairId: string
  side: OrderSideName
  orderType: OrderTypeName
  amount: number
  limitPrice: number | null
  stopPrice: number | null
  referencePrice: number
  requestToken: string
}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so no order was sent.')
  const { data, error } = await getSupabase().rpc('submit_simulated_order', {
    target_pair: input.pairId,
    order_side: input.side,
    order_type: input.orderType,
    order_amount: input.amount,
    limit_price: input.limitPrice,
    stop_price: input.stopPrice,
    reference_price: input.referencePrice,
    quoted_at: new Date().toISOString(),
    request_token: input.requestToken,
  })
  if (error) throw new Error(rpcError(error))
  if (typeof data !== 'string') throw new Error('The order did not return a record id.')
  requestDeskRefresh()
  return data
}

export async function cancelSimulatedOrder(orderId: string) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured, so the order was not cancelled.')
  const { error } = await getSupabase().rpc('cancel_simulated_order', { target_order: orderId })
  if (error) throw new Error(rpcError(error))
  requestDeskRefresh()
}

export type RestingPair = {
  pairId: string
  baseProviderId: string
  quoteProviderId: string
}

export async function loadRestingPairs(): Promise<RestingPair[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await getSupabase()
    .from('orders')
    .select('pair_id, trading_pairs!inner(base:assets!trading_pairs_base_asset_id_fkey(provider_asset_id), quote:assets!trading_pairs_quote_asset_id_fkey(provider_asset_id))')
    .in('status', ['open', 'inactive'])
  if (error) return []
  const rows = Array.isArray(data) ? data : []
  const seen = new Set<string>()
  const pairs: RestingPair[] = []
  for (const row of rows) {
    const record = row as {
      pair_id?: string
      trading_pairs?: {
        base?: { provider_asset_id?: string } | { provider_asset_id?: string }[]
        quote?: { provider_asset_id?: string } | { provider_asset_id?: string }[]
      }
    }
    const pair = record.trading_pairs
    const base = Array.isArray(pair?.base) ? pair.base[0] : pair?.base
    const quote = Array.isArray(pair?.quote) ? pair.quote[0] : pair?.quote
    const pairId = record.pair_id ?? ''
    const baseProviderId = base?.provider_asset_id ?? ''
    const quoteProviderId = quote?.provider_asset_id ?? ''
    if (!pairId || !baseProviderId || !quoteProviderId || seen.has(pairId)) continue
    seen.add(pairId)
    pairs.push({ pairId, baseProviderId, quoteProviderId })
  }
  return pairs
}

export async function processSimulatedOrders(quotes: { pairId: string; price: number }[]) {
  if (!isSupabaseConfigured() || quotes.length === 0) return 0
  const { data, error } = await getSupabase().rpc('process_simulated_orders', {
    pair_ids: quotes.map((quote) => quote.pairId),
    reference_prices: quotes.map((quote) => quote.price),
    quoted_at: new Date().toISOString(),
  })
  if (error) throw new Error(rpcError(error))
  return typeof data === 'number' ? data : 0
}
