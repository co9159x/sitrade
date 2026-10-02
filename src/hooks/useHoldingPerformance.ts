import { useEffect, useState } from 'react'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { basketSeries } from '@/lib/portfolio'
import { getMarketDataProvider } from '@/services/marketData'

export type HoldingInput = {
  symbol: string
  providerAssetId: string
  quantity: number
}

export function useHoldingPerformance(holdings: HoldingInput[]) {
  const { currency } = useDisplayCurrency()
  const [points, setPoints] = useState<{ time: number; value: number }[]>([])
  const [bySymbol, setBySymbol] = useState<Map<string, { time: number; value: number }[]>>(new Map())
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const key = `${currency}|${holdings.map((holding) => `${holding.providerAssetId}:${holding.quantity}`).sort().join('|')}`

  useEffect(() => {
    if (holdings.length === 0) {
      setPoints([])
      setBySymbol(new Map())
      setStatus('idle')
      return
    }
    let active = true
    setStatus('loading')
    setPoints([])
    const provider = getMarketDataProvider()
    Promise.all(
      holdings.map(async (holding) => ({
        symbol: holding.symbol,
        points: await provider.getHistoricalPrices(holding.providerAssetId, '30'),
      })),
    )
      .then((histories) => {
        if (!active) return
        const next = new Map<string, { time: number; value: number }[]>()
        for (const holding of holdings) {
          next.set(holding.symbol, basketSeries([holding], histories.filter((history) => history.symbol === holding.symbol)))
        }
        setBySymbol(next)
        setPoints(basketSeries(holdings, histories))
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setPoints([])
        setBySymbol(new Map())
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [key])

  return { points, bySymbol, status, currency }
}
