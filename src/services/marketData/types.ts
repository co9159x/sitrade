export type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W'

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

export type MarketListing = {
  providerAssetId: string
  symbol: string
  name: string
  image: string | null
  rank: number | null
  price: number
  currency: string
  change24hPercent: number | null
  change24h: number | null
  high24h: number | null
  low24h: number | null
  volume24h: number | null
  marketCap: number | null
}

export type CoinLink = {
  label: string
  url: string
}

export type CoinProfile = {
  providerAssetId: string
  symbol: string
  name: string
  image: string | null
  rank: number | null
  descriptionHtml: string
  genesisDate: string | null
  categories: string[]
  price: number | null
  currency: string
  change24hPercent: number | null
  change24h: number | null
  change7dPercent: number | null
  change30dPercent: number | null
  change1yPercent: number | null
  high24h: number | null
  low24h: number | null
  volume24h: number | null
  marketCap: number | null
  fullyDilutedValue: number | null
  circulatingSupply: number | null
  totalSupply: number | null
  maxSupply: number | null
  ath: number | null
  athChangePercent: number | null
  athDate: string | null
  atl: number | null
  atlChangePercent: number | null
  atlDate: string | null
  platform: string | null
  contractAddress: string | null
  links: CoinLink[]
  asOf: string | null
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
