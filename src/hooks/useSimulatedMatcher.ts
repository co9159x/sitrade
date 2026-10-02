import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useMarketPrices } from '@/hooks/useMarketPrices'
import { crossPrice, loadRestingPairs, processSimulatedOrders, requestDeskRefresh, type RestingPair } from '@/services/orders'

export function useSimulatedMatcher() {
  const { configured, session } = useAuth()
  const [book, setBook] = useState<RestingPair[]>([])
  const prices = useMarketPrices(book.flatMap((row) => [row.baseProviderId, row.quoteProviderId]))
  const lastKey = useRef('')
  const inflight = useRef(false)
  const latest = useRef<{ key: string; quotes: { pairId: string; price: number }[] } | null>(null)

  useEffect(() => {
    if (!configured || !session) {
      setBook([])
      return
    }
    let active = true
    const load = () => {
      void loadRestingPairs().then((next) => {
        if (active) setBook(next)
      })
    }
    load()
    window.addEventListener('sitrade-desk-refresh', load)
    return () => {
      active = false
      window.removeEventListener('sitrade-desk-refresh', load)
    }
  }, [configured, session])

  useEffect(() => {
    if (!configured || !session || book.length === 0 || prices.status.state !== 'live') return
    const quotes = book.flatMap((row) => {
      const price = crossPrice(prices.byId.get(row.baseProviderId)?.price, prices.byId.get(row.quoteProviderId)?.price)
      return price === null ? [] : [{ pairId: row.pairId, price }]
    })
    if (quotes.length !== book.length) return
    const key = quotes.map((quote) => `${quote.pairId}:${quote.price}`).join('|')
    latest.current = { key, quotes }

    const pump = () => {
      const current = latest.current
      if (!current || current.key === lastKey.current || inflight.current) return
      inflight.current = true
      const batch = current
      void processSimulatedOrders(batch.quotes)
        .then((count) => {
          lastKey.current = batch.key
          if (count > 0) requestDeskRefresh()
        })
        .catch(() => {
          lastKey.current = batch.key
        })
        .finally(() => {
          inflight.current = false
          pump()
        })
    }
    pump()
  }, [book, configured, prices.byId, prices.status.state, session])
}
