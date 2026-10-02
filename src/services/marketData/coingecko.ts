import type { AssetMetadata, HistoricalPrice, MarketPrice, OHLCCandle, Timeframe } from '@/services/marketData/types'
import { getDisplayCurrency } from '@/lib/currency'

const freshMs = 45_000
const chartFreshMs = 5 * 60_000

export class MarketDataError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'rate' | 'timeframe' | 'response',
  ) {
    super(message)
  }
}

type CacheEntry<T> = { value: T; at: number }

const priceCache = new Map<string, CacheEntry<MarketPrice>>()
const chartCache = new Map<string, CacheEntry<OHLCCandle[]>>()
const historyCache = new Map<string, CacheEntry<HistoricalPrice[]>>()

function apiBase() {
  const configured = import.meta.env.VITE_PUBLIC_COINGECKO_API_URL?.trim()
  return (configured || 'https://api.coingecko.com/api/v3').replace(/\/$/, '')
}

function quoteCurrency() {
  return getDisplayCurrency().toLowerCase()
}

function priceKey(id: string) {
  return `${quoteCurrency()}:${id}`
}

async function request(path: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, { headers: { accept: 'application/json' } })
  } catch {
    throw new MarketDataError('Market data could not be reached.', 'network')
  }
  if (response.status === 429) throw new MarketDataError('CoinGecko rate limit reached.', 'rate')
  if (!response.ok) throw new MarketDataError(`CoinGecko returned ${response.status}.`, 'response')
  return response.json() as Promise<unknown>
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function num(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mapPrice(row: Record<string, unknown>): MarketPrice | null {
  const price = num(row.current_price)
  const id = typeof row.id === 'string' ? row.id : ''
  const symbol = typeof row.symbol === 'string' ? row.symbol.toUpperCase() : ''
  if (!id || !symbol || price === null) return null
  return {
    providerAssetId: id,
    symbol,
    currency: getDisplayCurrency(),
    price,
    change24hPercent: num(row.price_change_percentage_24h),
    high24h: num(row.high_24h),
    low24h: num(row.low_24h),
    volume24h: num(row.total_volume),
    marketCap: num(row.market_cap),
    asOf: typeof row.last_updated === 'string' ? row.last_updated : new Date().toISOString(),
  }
}

const frames: Record<Timeframe, { days: string; bucketMs: number } | null> = {
  '1m': null,
  '5m': { days: '1', bucketMs: 5 * 60_000 },
  '15m': { days: '1', bucketMs: 15 * 60_000 },
  '1H': { days: '7', bucketMs: 60 * 60_000 },
  '4H': { days: '30', bucketMs: 4 * 60 * 60_000 },
  '1D': { days: '365', bucketMs: 24 * 60 * 60_000 },
}

function pairs(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!Array.isArray(item) || item.length < 2) return []
    const time = num(item[0])
    const point = num(item[1])
    return time === null || point === null ? [] : [[time, point] as const]
  })
}

function candlesFromPrices(points: readonly (readonly [number, number])[], bucketMs: number): OHLCCandle[] {
  const buckets = new Map<number, OHLCCandle>()
  for (const [time, price] of points) {
    const bucket = Math.floor(time / bucketMs) * bucketMs
    const existing = buckets.get(bucket)
    if (!existing) {
      buckets.set(bucket, { time: bucket, open: price, high: price, low: price, close: price, volume: 0 })
    } else {
      existing.high = Math.max(existing.high, price)
      existing.low = Math.min(existing.low, price)
      existing.close = price
    }
  }
  return [...buckets.values()].sort((left, right) => left.time - right.time)
}

export class CoinGeckoProvider {
  async getMarketPrices(providerAssetIds: string[]): Promise<MarketPrice[]> {
    const ids = [...new Set(providerAssetIds.filter(Boolean))]
    if (ids.length === 0) return []
    const now = Date.now()
    const missing = ids.filter((id) => {
      const hit = priceCache.get(priceKey(id))
      return !hit || now - hit.at > freshMs
    })
    if (missing.length > 0) {
      const payload = await request(
        `/coins/markets?vs_currency=${quoteCurrency()}&ids=${encodeURIComponent(missing.join(','))}&price_change_percentage=24h`,
      )
      if (!Array.isArray(payload)) throw new MarketDataError('CoinGecko returned an unexpected price list.', 'response')
      const found = new Set<string>()
      for (const item of payload) {
        const row = asRecord(item)
        const price = row ? mapPrice(row) : null
        if (!price) continue
        priceCache.set(priceKey(price.providerAssetId), { value: price, at: now })
        found.add(price.providerAssetId)
      }
      for (const id of missing) {
        if (!found.has(id)) priceCache.delete(priceKey(id))
      }
    }
    return ids.flatMap((id) => {
      const hit = priceCache.get(priceKey(id))
      return hit ? [hit.value] : []
    })
  }

  async getAssetPrice(providerAssetId: string) {
    const [price] = await this.getMarketPrices([providerAssetId])
    if (!price) throw new MarketDataError(`No CoinGecko price for ${providerAssetId}.`, 'response')
    return price
  }

  async getMarketOverview() {
    const payload = await request(`/coins/markets?vs_currency=${quoteCurrency()}&order=market_cap_desc&per_page=15&page=1&price_change_percentage=24h`)
    if (!Array.isArray(payload)) throw new MarketDataError('CoinGecko returned an unexpected overview.', 'response')
    return payload.flatMap((item) => {
      const row = asRecord(item)
      const price = row ? mapPrice(row) : null
      return price ? [price] : []
    })
  }

  async getHistoricalPrices(providerAssetId: string, range: string): Promise<HistoricalPrice[]> {
    const key = `${quoteCurrency()}:${providerAssetId}:${range}`
    const hit = historyCache.get(key)
    if (hit && Date.now() - hit.at < chartFreshMs) return hit.value
    const payload = asRecord(await request(`/coins/${encodeURIComponent(providerAssetId)}/market_chart?vs_currency=${quoteCurrency()}&days=${encodeURIComponent(range)}`))
    const series = pairs(payload?.prices).map(([time, price]) => ({ time, price }))
    historyCache.set(key, { value: series, at: Date.now() })
    return series
  }

  async getOHLCData(providerAssetId: string, timeframe: Timeframe): Promise<OHLCCandle[]> {
    const frame = frames[timeframe]
    if (!frame) {
      throw new MarketDataError('CoinGecko does not provide 1-minute candles on this connection.', 'timeframe')
    }
    const key = `${quoteCurrency()}:${providerAssetId}:${timeframe}`
    const hit = chartCache.get(key)
    if (hit && Date.now() - hit.at < chartFreshMs) return hit.value
    const history = await this.getHistoricalPrices(providerAssetId, frame.days)
    const candles = candlesFromPrices(history.map((point) => [point.time, point.price] as const), frame.bucketMs)
    chartCache.set(key, { value: candles, at: Date.now() })
    return candles
  }

  async getAssetMetadata(providerAssetId: string): Promise<AssetMetadata> {
    const payload = asRecord(
      await request(`/coins/${encodeURIComponent(providerAssetId)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`),
    )
    return {
      providerAssetId,
      symbol: typeof payload?.symbol === 'string' ? payload.symbol.toUpperCase() : providerAssetId,
      name: typeof payload?.name === 'string' ? payload.name : providerAssetId,
    }
  }
}

export function clearMarketCache() {
  priceCache.clear()
  chartCache.clear()
  historyCache.clear()
}
