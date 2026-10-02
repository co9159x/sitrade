import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isOperator } from '@/services/account'
import { loadAdminDesk, type AdminSnapshot } from '@/services/adminDesk'

export type AdminDeskStatus = 'unconfigured' | 'loading' | 'ready' | 'denied' | 'error'

const empty: AdminSnapshot = {
  profiles: [],
  assets: [],
  pairs: [],
  balances: [],
  deposits: [],
  withdrawals: [],
  orders: [],
  trades: [],
  ledger: [],
  audit: [],
}

export function adminEmpty(status: AdminDeskStatus, ready: string) {
  if (status === 'unconfigured') return 'Supabase is not configured, so operations records are not loaded.'
  if (status === 'denied') return 'This account cannot read operations records.'
  if (status === 'error') return 'The records could not be read.'
  return ready
}

export function useAdminDesk() {
  const { configured, session, profile, profileLoading } = useAuth()
  const [status, setStatus] = useState<AdminDeskStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminSnapshot>(empty)

  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    if (!configured) {
      setStatus('unconfigured')
      setData(empty)
      setError(null)
      return
    }
    if (!session || profileLoading) {
      setStatus('loading')
      return
    }
    if (!profile || !isOperator(profile.role)) {
      setStatus('denied')
      setData(empty)
      return
    }

    let active = true
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    loadAdminDesk()
      .then((next) => {
        if (!active) return
        setData(next)
        setError(null)
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (!active) return
        setData(empty)
        setError(reason instanceof Error ? reason.message : 'Operations records could not be loaded.')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [configured, session, profile, profileLoading, tick])

  return { status, error, reload, ...data }
}
