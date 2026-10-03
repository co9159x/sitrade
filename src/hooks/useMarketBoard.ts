import { useEffect, useRef, useState } from 'react'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { loadCoinProfile, loadHistory, loadMarketPage, loadTrendingAssets, searchMarketAssets } from '@/services/marketData'
import { MarketDataError } from '@/services/marketData/coingecko'
import type { CoinProfile, HistoricalPrice, MarketListing } from '@/services/marketData/types'

type BoardStatus = 'loading' | 'ready' | 'refreshing' | 'delayed' | 'error'

function messageOf(reason: unknown) {
  return reason instanceof MarketDataError || reason instanceof Error ? reason.message : 'Market data temporarily unavailable.'
}

export function useMarketBoard(page: number, order: 'market_cap_desc' | 'volume_desc', query: string, trending: boolean) {
  const { currency } = useDisplayCurrency()
  const [rows, setRows] = useState<MarketListing[]>([])
  const [status, setStatus] = useState<BoardStatus>('loading')
  const [message, setMessage] = useState('Loading market data')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  useEffect(() => {
    let active = true
    const load = (refreshing: boolean) => {
      setStatus((current) => (refreshing && current === 'ready' ? 'refreshing' : current === 'ready' ? 'refreshing' : 'loading'))
      const task = query.trim().length >= 2
        ? searchMarketAssets(query.trim())
        : trending
          ? loadTrendingAssets()
          : loadMarketPage(page, order)
      task
        .then((next) => {
          if (!active) return
          setRows(next)
          setUpdatedAt(new Date().toISOString())
          setStatus('ready')
          setMessage(next.length === 0 ? 'No matching assets were returned.' : 'Reference prices · CoinGecko')
        })
        .catch((reason: unknown) => {
          if (!active) return
          const text = messageOf(reason)
          if (rowsRef.current.length > 0) {
            setStatus('delayed')
            setMessage(`Data delayed. ${text}`)
            return
          }
          setStatus('error')
          setMessage(text)
        })
    }
    load(false)
    const timer = window.setInterval(() => load(true), 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [currency, order, page, query, trending])

  return { rows, status, message, updatedAt, hasMore: !query.trim() && !trending && rows.length === 100 }
}

export function useCoinProfile(providerAssetId: string | undefined) {
  const { currency } = useDisplayCurrency()
  const [profile, setProfile] = useState<CoinProfile | null>(null)
  const [status, setStatus] = useState<BoardStatus>('loading')
  const [message, setMessage] = useState('Loading coin information')

  useEffect(() => {
    if (!providerAssetId) {
      setProfile(null)
      setStatus('error')
      setMessage('No asset was selected.')
      return
    }
    let active = true
    setStatus('loading')
    loadCoinProfile(providerAssetId)
      .then((next) => {
        if (!active) return
        setProfile(next)
        setStatus('ready')
        setMessage('Reference profile · CoinGecko')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setProfile(null)
        setStatus('error')
        setMessage(messageOf(reason))
      })
    return () => {
      active = false
    }
  }, [currency, providerAssetId])

  return { profile, status, message }
}

export function usePriceHistory(providerAssetId: string | undefined, range: string) {
  const { currency } = useDisplayCurrency()
  const [points, setPoints] = useState<HistoricalPrice[]>([])
  const [status, setStatus] = useState<BoardStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!providerAssetId) return
    let active = true
    setStatus('loading')
    setPoints([])
    loadHistory(providerAssetId, range)
      .then((next) => {
        if (!active) return
        setPoints(next)
        setStatus('ready')
        setMessage(next.length === 0 ? 'CoinGecko returned no prices for this range.' : '')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setPoints([])
        setStatus('error')
        setMessage(messageOf(reason))
      })
    return () => {
      active = false
    }
  }, [currency, providerAssetId, range])

  return { points, status, message }
}
