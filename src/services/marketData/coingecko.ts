import type { AssetMetadata, CoinLink, CoinProfile, HistoricalPrice, MarketListing, MarketPrice, OHLCCandle, Timeframe } from '@/services/marketData/types'
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
const pageCache = new Map<string, CacheEntry<MarketListing[]>>()
const profileCache = new Map<string, CacheEntry<CoinProfile>>()

function apiBase() {
  const configured = import.meta.env.VITE_PUBLIC_COINGECKO_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/coingecko/api/v3'
  return 'https://api.coingecko.com/api/v3'
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
  '1W': { days: '365', bucketMs: 7 * 24 * 60 * 60_000 },
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

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function mapListing(row: Record<string, unknown>): MarketListing | null {
  const price = num(row.current_price)
  const id = text(row.id)
  const symbol = text(row.symbol)?.toUpperCase() ?? ''
  const name = text(row.name)
  if (!id || !symbol || !name || price === null) return null
  return {
    providerAssetId: id,
    symbol,
    name,
    image: text(row.image),
    rank: num(row.market_cap_rank),
    price,
    currency: getDisplayCurrency(),
    change24hPercent: num(row.price_change_percentage_24h),
    change24h: num(row.price_change_24h),
    high24h: num(row.high_24h),
    low24h: num(row.low_24h),
    volume24h: num(row.total_volume),
    marketCap: num(row.market_cap),
  }
}

function httpsLinks(label: string, value: unknown): CoinLink[] {
  const urls = Array.isArray(value) ? value : [value]
  return urls.flatMap((item) => {
    const url = text(item)
    return url && /^https:\/\//i.test(url) ? [{ label, url }] : []
  })
}

function quoteNumber(record: Record<string, unknown> | null, field: string) {
  const bag = asRecord(record?.[field])
  return bag ? num(bag[quoteCurrency()]) : null
}

export class CoinGeckoCatalogue {
  async getMarketPage(page: number, order: 'market_cap_desc' | 'volume_desc' = 'market_cap_desc') {
    const key = `${quoteCurrency()}:${order}:${page}`
    const hit = pageCache.get(key)
    if (hit && Date.now() - hit.at < freshMs) return hit.value
    const payload = await request(
      `/coins/markets?vs_currency=${quoteCurrency()}&order=${order}&per_page=100&page=${page}&sparkline=false&price_change_percentage=24h`,
    )
    if (!Array.isArray(payload)) throw new MarketDataError('CoinGecko returned an unexpected market list.', 'response')
    const rows = payload.flatMap((item) => {
      const row = asRecord(item)
      const listing = row ? mapListing(row) : null
      return listing ? [listing] : []
    })
    pageCache.set(key, { value: rows, at: Date.now() })
    return rows
  }

  async getListings(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))].slice(0, 20)
    if (unique.length === 0) return []
    const payload = await request(
      `/coins/markets?vs_currency=${quoteCurrency()}&ids=${encodeURIComponent(unique.join(','))}&sparkline=false&price_change_percentage=24h`,
    )
    if (!Array.isArray(payload)) throw new MarketDataError('CoinGecko returned an unexpected market list.', 'response')
    const rows = payload.flatMap((item) => {
      const row = asRecord(item)
      const listing = row ? mapListing(row) : null
      return listing ? [listing] : []
    })
    return unique.flatMap((id) => rows.filter((row) => row.providerAssetId === id))
  }

  async searchAssets(query: string) {
    const payload = asRecord(await request(`/search?query=${encodeURIComponent(query)}`))
    const coins = Array.isArray(payload?.coins) ? payload.coins : []
    const ids = coins.flatMap((item) => {
      const row = asRecord(item)
      const id = row ? text(row.id) : null
      return id ? [id] : []
    }).slice(0, 12)
    return this.getListings(ids)
  }

  async getTrending() {
    const payload = asRecord(await request('/search/trending'))
    const coins = Array.isArray(payload?.coins) ? payload.coins : []
    const ids = coins.flatMap((item) => {
      const row = asRecord(item)
      const coin = row ? asRecord(row.item) : null
      const id = coin ? text(coin.id) : null
      return id ? [id] : []
    })
    return this.getListings(ids)
  }

  async getCoinProfile(providerAssetId: string): Promise<CoinProfile> {
    const key = `${quoteCurrency()}:${providerAssetId}`
    const hit = profileCache.get(key)
    if (hit && Date.now() - hit.at < chartFreshMs) return hit.value
    const payload = asRecord(
      await request(
        `/coins/${encodeURIComponent(providerAssetId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      ),
    )
    if (!payload) throw new MarketDataError('CoinGecko returned an unexpected coin profile.', 'response')
    const market = asRecord(payload.market_data)
    const image = asRecord(payload.image)
    const links = asRecord(payload.links)
    const description = asRecord(payload.description)
    const platforms = asRecord(payload.platforms)
    const platformId = text(payload.asset_platform_id)
    const contract = platformId && platforms ? text(platforms[platformId]) : null
    const collected: CoinLink[] = [
      ...httpsLinks('Website', links?.homepage),
      ...httpsLinks('Whitepaper', links?.whitepaper),
      ...httpsLinks('Explorer', links?.blockchain_site),
      ...httpsLinks('GitHub', asRecord(links?.repos_url)?.github),
      ...httpsLinks('Forum', links?.official_forum_url),
      ...httpsLinks('Chat', links?.chat_url),
    ]
    const twitter = text(links?.twitter_screen_name)
    if (twitter) collected.push({ label: 'X', url: `https://x.com/${encodeURIComponent(twitter)}` })
    const reddit = text(links?.subreddit_url)
    if (reddit && /^https:\/\//i.test(reddit)) collected.push({ label: 'Reddit', url: reddit })
    const telegram = text(links?.telegram_channel_identifier)
    if (telegram) collected.push({ label: 'Telegram', url: `https://t.me/${encodeURIComponent(telegram)}` })
    const uniqueLinks = collected.filter((link, index) => collected.findIndex((item) => item.url === link.url) === index)
    const profile: CoinProfile = {
      providerAssetId,
      symbol: text(payload.symbol)?.toUpperCase() ?? providerAssetId,
      name: text(payload.name) ?? providerAssetId,
      image: text(image?.large) ?? text(image?.small),
      rank: market ? num(market.market_cap_rank) : null,
      descriptionHtml: text(description?.en) ?? '',
      genesisDate: text(payload.genesis_date),
      categories: Array.isArray(payload.categories) ? payload.categories.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [],
      price: quoteNumber(market, 'current_price'),
      currency: getDisplayCurrency(),
      change24hPercent: market ? num(market.price_change_percentage_24h) : null,
      change24h: quoteNumber(market, 'price_change_24h_in_currency') ?? (market ? num(market.price_change_24h) : null),
      change7dPercent: market ? num(market.price_change_percentage_7d) : null,
      change30dPercent: market ? num(market.price_change_percentage_30d) : null,
      change1yPercent: market ? num(market.price_change_percentage_1y) : null,
      high24h: quoteNumber(market, 'high_24h'),
      low24h: quoteNumber(market, 'low_24h'),
      volume24h: quoteNumber(market, 'total_volume'),
      marketCap: quoteNumber(market, 'market_cap'),
      fullyDilutedValue: quoteNumber(market, 'fully_diluted_valuation'),
      circulatingSupply: market ? num(market.circulating_supply) : null,
      totalSupply: market ? num(market.total_supply) : null,
      maxSupply: market ? num(market.max_supply) : null,
      ath: quoteNumber(market, 'ath'),
      athChangePercent: quoteNumber(market, 'ath_change_percentage'),
      athDate: text(asRecord(market?.ath_date)?.[quoteCurrency()]),
      atl: quoteNumber(market, 'atl'),
      atlChangePercent: quoteNumber(market, 'atl_change_percentage'),
      atlDate: text(asRecord(market?.atl_date)?.[quoteCurrency()]),
      platform: platformId,
      contractAddress: contract,
      links: uniqueLinks,
      asOf: text(market?.last_updated),
    }
    profileCache.set(key, { value: profile, at: Date.now() })
    return profile
  }
}

export function clearMarketCache() {
  priceCache.clear()
  chartCache.clear()
  historyCache.clear()
  pageCache.clear()
  profileCache.clear()
}
