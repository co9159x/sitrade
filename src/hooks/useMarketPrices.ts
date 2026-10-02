import { useEffect, useMemo, useState } from 'react'
import { trainingCatalogue } from '@/services/marketData/catalogue'
import { MarketDataError } from '@/services/marketData/coingecko'
import { loadCandles, readMarketHub, subscribePrices, subscribeStatus, describeMarketDataConnection } from '@/services/marketData'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import type { MarketPrice, OHLCCandle, Timeframe } from '@/services/marketData/types'
import type { DeskAsset } from '@/services/desk'
import type { DeskStatus } from '@/hooks/useDesk'

export function useMarketDataStatus() {
  const [status, setStatus] = useState(describeMarketDataConnection())
  useEffect(() => subscribeStatus(() => setStatus(describeMarketDataConnection())), [])
  return status
}

export function useMarketPrices(ids: string[]) {
  const key = [...new Set(ids.filter(Boolean))].sort().join('|')
  const [hub, setHub] = useState(readMarketHub)

  useEffect(() => {
    const stable = key ? key.split('|') : []
    if (stable.length === 0) return
    return subscribePrices(stable, () => setHub(readMarketHub()))
  }, [key])

  const byId = useMemo(() => {
    const map = new Map<string, MarketPrice>()
    for (const id of key ? key.split('|') : []) {
      const price = hub.prices.get(id)
      if (price) map.set(id, price)
    }
    return map
  }, [hub, key])

  return { status: hub.status, byId }
}

export function pricesBySymbol(assets: { symbol: string; providerAssetId: string }[], byId: Map<string, MarketPrice>) {
  const map = new Map<string, MarketPrice>()
  for (const asset of assets) {
    const price = byId.get(asset.providerAssetId)
    if (price) map.set(asset.symbol, price)
  }
  return map
}

export function assetsForQuotes(assets: DeskAsset[], status: DeskStatus) {
  if (assets.length > 0) return { assets, previewCatalogue: false }
  if (status === 'unconfigured') return { assets: trainingCatalogue, previewCatalogue: true }
  return { assets, previewCatalogue: false }
}

export function useCandles(providerAssetId: string | null, timeframe: Timeframe) {
  const [candles, setCandles] = useState<OHLCCandle[]>([])
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const { currency } = useDisplayCurrency()

  useEffect(() => {
    if (!providerAssetId) {
      setCandles([])
      setPhase('idle')
      setMessage('')
      return
    }
    let active = true
    setCandles([])
    setPhase('loading')
    setMessage('')
    const run = () => {
      setPhase((current) => (current === 'ready' ? current : 'loading'))
      loadCandles(providerAssetId, timeframe)
        .then((next) => {
          if (!active) return
          setCandles(next)
          setPhase('ready')
          setMessage(next.length === 0 ? 'CoinGecko returned no candles for this range.' : '')
        })
        .catch((reason: unknown) => {
          if (!active) return
          setCandles([])
          setPhase('error')
          setMessage(reason instanceof MarketDataError || reason instanceof Error ? reason.message : 'Candles could not be loaded.')
        })
    }
    run()
    const timer = window.setInterval(run, 5 * 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [providerAssetId, timeframe, currency])

  return { candles, phase, message }
}
