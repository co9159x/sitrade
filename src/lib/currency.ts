export const displayCurrencies = ['GBP', 'USD', 'EUR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'NGN'] as const

export type DisplayCurrency = (typeof displayCurrencies)[number]

const storageKey = 'sitrade.currency'

const regionCurrency: Record<string, DisplayCurrency> = {
  GB: 'GBP',
  UK: 'GBP',
  US: 'USD',
  JP: 'JPY',
  CA: 'CAD',
  AU: 'AUD',
  CH: 'CHF',
  CN: 'CNY',
  IN: 'INR',
  NG: 'NGN',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
}

const listeners = new Set<() => void>()
let current = readInitialCurrency()

function readInitialCurrency(): DisplayCurrency {
  try {
    const saved = localStorage.getItem(storageKey)
    if (isDisplayCurrency(saved)) return saved
  } catch {
    // Private browsing can block storage. Fall through to the locale.
  }
  const region = navigator.language.split('-')[1]?.toUpperCase() ?? ''
  return regionCurrency[region] ?? 'USD'
}

export function isDisplayCurrency(value: string | null | undefined): value is DisplayCurrency {
  return displayCurrencies.includes(value as DisplayCurrency)
}

export function getDisplayCurrency() {
  return current
}

export function setDisplayCurrency(value: string) {
  if (!isDisplayCurrency(value) || value === current) return
  current = value
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // The choice still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeCurrency(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
