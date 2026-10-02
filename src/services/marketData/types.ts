export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D'

export type MarketPrice = {
  providerAssetId: string
  symbol: string
  currency: string
  price: number
  change24hPercent: number | null
  high24h: number | null
  low24h: number | null
  volume24h: number | null
  marketCap: number | null
  asOf: string
}

export type HistoricalPrice = {
  time: number
  price: number
}

export type OHLCCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type AssetMetadata = {
  providerAssetId: string
  symbol: string
  name: string
}

export interface MarketDataProvider {
  getMarketPrices(providerAssetIds: string[]): Promise<MarketPrice[]>
  getAssetPrice(providerAssetId: string): Promise<MarketPrice>
  getMarketOverview(): Promise<MarketPrice[]>
  getHistoricalPrices(providerAssetId: string, range: string): Promise<HistoricalPrice[]>
  getOHLCData(providerAssetId: string, timeframe: Timeframe): Promise<OHLCCandle[]>
  getAssetMetadata(providerAssetId: string): Promise<AssetMetadata>
}

export type MarketConnectionState = 'disconnected' | 'live' | 'delayed' | 'loading' | 'error'

export type MarketDataStatus = {
  state: MarketConnectionState
  provider: string | null
  message: string
  updatedAt: string | null
}
