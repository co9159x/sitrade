import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  loadDesk,
  type DeskAsset,
  type DeskBalance,
  type DeskNotification,
  type DeskOrder,
  type DeskPair,
  type DeskSnapshot,
  type DeskTrade,
  type DeskTransaction,
  type DeskWatch,
} from '@/services/desk'

export type DeskStatus = 'unconfigured' | 'signed-out' | 'loading' | 'ready' | 'error'

const empty: DeskSnapshot = {
  assets: [],
  pairs: [],
  balances: [],
  orders: [],
  trades: [],
  transactions: [],
  notifications: [],
  watchlist: [],
  feeRate: null,
}

export function deskEmpty(status: DeskStatus, ready: string) {
  if (status === 'unconfigured') return 'Supabase is not configured, so this list is not loaded.'
  if (status === 'signed-out') return 'Sign in to load this account.'
  if (status === 'error') return 'The records could not be read.'
  return ready
}

export function useDesk() {
  const { configured, session } = useAuth()
  const [status, setStatus] = useState<DeskStatus>(configured && session ? 'loading' : configured ? 'signed-out' : 'unconfigured')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DeskSnapshot>(empty)

  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured')
      setData(empty)
      setError(null)
      return
    }
    if (!session) {
      setStatus('signed-out')
      setData(empty)
      setError(null)
      return
    }

    let active = true
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    loadDesk()
      .then((next) => {
        if (!active) return
        setData(next)
        setError(null)
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setData(empty)
        setError(reason instanceof Error ? reason.message : 'Account records could not be loaded.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [configured, session, tick])

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('sitrade-desk-refresh', refresh)
    return () => window.removeEventListener('sitrade-desk-refresh', refresh)
  }, [])

  return { status, error, reload, ...data }
}

export type {
  DeskAsset,
  DeskBalance,
  DeskNotification,
  DeskOrder,
  DeskPair,
  DeskTrade,
  DeskTransaction,
  DeskWatch,
}
