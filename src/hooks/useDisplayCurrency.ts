import { useEffect, useState } from 'react'
import { getDisplayCurrency, setDisplayCurrency, subscribeCurrency, type DisplayCurrency } from '@/lib/currency'
import { applyDisplayCurrency } from '@/services/marketData'

export function useDisplayCurrency() {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(getDisplayCurrency)

  useEffect(() => subscribeCurrency(() => setCurrencyState(getDisplayCurrency())), [])

  return {
    currency,
    setCurrency(next: string) {
      if (next === getDisplayCurrency()) return
      setDisplayCurrency(next)
      applyDisplayCurrency()
    },
  }
}
