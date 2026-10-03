import { CoinGeckoCatalogue, CoinGeckoProvider, MarketDataError, clearMarketCache } from '@/services/marketData/coingecko'
import type { MarketDataProvider, MarketDataStatus, MarketPrice, Timeframe } from '@/services/marketData/types'

const providerName = () => import.meta.env.VITE_PUBLIC_MARKET_DATA_PROVIDER?.trim() || 'coingecko'

class UnavailableMarketDataProvider implements MarketDataProvider {
  constructor(private readonly name: string) {}

  private fail(): never {
    throw new MarketDataError(`Market data provider "${this.name}" is not connected. No prices were generated.`, 'response')
  }

  getMarketPrices(): Promise<MarketPrice[]> {
    return this.fail()
  }

  getAssetPrice(): Promise<MarketPrice> {
    return this.fail()
  }

  getMarketOverview(): Promise<MarketPrice[]> {
    return this.fail()
  }

  getHistoricalPrices(): Promise<{ time: number; price: number }[]> {
    return this.fail()
  }

  getOHLCData(): Promise<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]> {
    return this.fail()
  }

  getAssetMetadata(): Promise<{ providerAssetId: string; symbol: string; name: string }> {
    return this.fail()
  }
}

let coingecko: CoinGeckoProvider | null = null

export function getMarketDataProvider(): MarketDataProvider {
  const name = providerName()
  if (name === 'coingecko') {
    coingecko ??= new CoinGeckoProvider()
    return coingecko
  }
  return new UnavailableMarketDataProvider(name)
}

export function providerIsLive() {
  return providerName() === 'coingecko'
}

type Listener = () => void

type HubState = {
  status: MarketDataStatus
  prices: Map<string, MarketPrice>
}

const listeners = new Set<Listener>()
const wanted = new Map<string, number>()
let state: HubState = {
  status: {
    state: providerIsLive() ? 'loading' : 'disconnected',
    provider: providerName(),
    message: providerIsLive() ? 'Loading market data' : 'Market data not connected',
    updatedAt: null,
  },
  prices: new Map(),
}
let timer: ReturnType<typeof setInterval> | null = null
let refreshing = false
let refreshAgain = false
let quoteEpoch = 0
let pollMs = 60_000

function emit() {
  listeners.forEach((listener) => listener())
}

function setStatus(next: MarketDataStatus) {
  state = { ...state, status: next }
  emit()
}

async function refresh() {
  const ids = [...wanted.keys()]
  if (!providerIsLive() || ids.length === 0) return
  if (refreshing) {
    refreshAgain = true
    return
  }
  refreshing = true
  const epoch = quoteEpoch
  if (state.prices.size === 0) {
    setStatus({ state: 'loading', provider: 'coingecko', message: 'Loading market data', updatedAt: null })
  }
  try {
    const prices = await getMarketDataProvider().getMarketPrices(ids)
    if (epoch !== quoteEpoch) return
    const next = new Map(state.prices)
    const returned = new Set(prices.map((price) => price.providerAssetId))
    for (const price of prices) next.set(price.providerAssetId, price)
    for (const id of ids) {
      if (!returned.has(id)) next.delete(id)
    }
    const updatedAt = prices.reduce<string | null>((latest, price) => {
      if (!latest || price.asOf > latest) return price.asOf
      return latest
    }, null)
    state = {
      prices: next,
      status: {
        state: 'live',
        provider: 'coingecko',
        message: 'Live reference prices · CoinGecko',
        updatedAt,
      },
    }
    pollMs = 60_000
    emit()
  } catch (reason) {
    if (epoch !== quoteEpoch) return
    const rate = reason instanceof MarketDataError && reason.kind === 'rate'
    pollMs = rate ? 120_000 : 60_000
    const message = reason instanceof Error ? reason.message : 'Market data could not be refreshed.'
    if (state.prices.size > 0) {
      setStatus({
        state: 'delayed',
        provider: 'coingecko',
        message: `Market data delayed. ${message}`,
        updatedAt: state.status.updatedAt,
      })
    } else {
      setStatus({
        state: 'error',
        provider: 'coingecko',
        message,
        updatedAt: null,
      })
    }
  } finally {
    refreshing = false
    const pending = [...wanted.keys()]
    const covered = ids.every((id) => pending.includes(id)) && pending.every((id) => ids.includes(id))
    const stale = refreshAgain || epoch !== quoteEpoch
    refreshAgain = false
    if ((stale || !covered) && pending.length > 0) void refresh()
    else schedule()
  }
}

function schedule() {
  if (timer) clearInterval(timer)
  timer = null
  if (wanted.size === 0) return
  timer = setInterval(() => void refresh(), pollMs)
}

export function subscribePrices(ids: string[], listener: Listener) {
  listeners.add(listener)
  for (const id of ids) wanted.set(id, (wanted.get(id) ?? 0) + 1)
  schedule()
  void refresh()
  return () => {
    listeners.delete(listener)
    for (const id of ids) {
      const next = (wanted.get(id) ?? 1) - 1
      if (next <= 0) wanted.delete(id)
      else wanted.set(id, next)
    }
    schedule()
  }
}

export function subscribeStatus(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function readMarketHub() {
  return state
}

export function applyDisplayCurrency() {
  quoteEpoch += 1
  clearMarketCache()
  state = {
    prices: new Map(),
    status: {
      state: providerIsLive() ? 'loading' : 'disconnected',
      provider: providerName(),
      message: providerIsLive() ? 'Loading market data' : 'Market data not connected',
      updatedAt: null,
    },
  }
  emit()
  void refresh()
}

export function describeMarketDataConnection(): MarketDataStatus {
  return state.status
}

export async function loadCandles(providerAssetId: string, timeframe: Timeframe) {
  return getMarketDataProvider().getOHLCData(providerAssetId, timeframe)
}

export async function loadHistory(providerAssetId: string, range: string) {
  return getMarketDataProvider().getHistoricalPrices(providerAssetId, range)
}

let catalogue: CoinGeckoCatalogue | null = null

function liveCatalogue() {
  if (!providerIsLive()) {
    throw new MarketDataError('Market data provider is not connected. No prices were generated.', 'response')
  }
  catalogue ??= new CoinGeckoCatalogue()
  return catalogue
}

export function loadMarketPage(page: number, order: 'market_cap_desc' | 'volume_desc' = 'market_cap_desc') {
  return liveCatalogue().getMarketPage(page, order)
}

export function searchMarketAssets(query: string) {
  return liveCatalogue().searchAssets(query)
}

export function loadTrendingAssets() {
  return liveCatalogue().getTrending()
}

export function loadCoinProfile(providerAssetId: string) {
  return liveCatalogue().getCoinProfile(providerAssetId)
}
