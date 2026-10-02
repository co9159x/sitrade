export const EMPTY_VALUE = '—'

export function formatMoney(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 1000 ? 2 : 6,
  }).format(value)
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatCompact(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatAmount(value: number) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(value)
}

export function labelize(value: string) {
  return value.replaceAll('_', ' ')
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
