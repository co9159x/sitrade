import type { ReactNode } from 'react'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { EMPTY_VALUE, formatDateTime, formatMoney, formatPercent } from '@/utils/format'
import { useMarketDataStatus } from '@/hooks/useMarketDataStatus'
import type { MarketPrice } from '@/services/marketData/types'

export function TradeHeader({
  symbol,
  name,
  price,
}: {
  symbol: string | null
  name?: string
  price: MarketPrice | null
}) {
  const market = useMarketDataStatus()
  const { currency } = useDisplayCurrency()
  const pair = symbol ? `${symbol}/${currency}` : 'Not selected'

  return (
    <section className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-panel p-4 xl:grid-cols-6">
      <div className="col-span-2 sm:col-span-1">
        <p className="text-xs text-muted">Pair</p>
        <p className="mt-1 font-display text-2xl tracking-wide">{pair}</p>
        {name ? <p className="text-xs text-muted">{name}</p> : null}
      </div>
      <HeaderStat label="Price" value={price ? formatMoney(price.price, price.currency) : EMPTY_VALUE} />
      <HeaderStat label="24h change" value={price?.change24hPercent === null || price?.change24hPercent === undefined ? EMPTY_VALUE : formatPercent(price.change24hPercent)} tone={toneFor(price?.change24hPercent)} />
      <HeaderStat label="24h high" value={price?.high24h === null || price?.high24h === undefined ? EMPTY_VALUE : formatMoney(price.high24h, price.currency)} />
      <HeaderStat label="24h low" value={price?.low24h === null || price?.low24h === undefined ? EMPTY_VALUE : formatMoney(price.low24h, price.currency)} />
      <div>
        <p className="text-xs text-muted">Market status</p>
        <p className={`mt-1 text-sm ${market.state === 'live' ? 'text-up' : 'text-warn'}`}>{market.message}</p>
        <p className="text-xs text-muted">{market.updatedAt ? `Updated ${formatDateTime(market.updatedAt)}` : 'Updated time unavailable'}</p>
      </div>
    </section>
  )
}

function toneFor(value: number | null | undefined) {
  if (value === null || value === undefined) return undefined
  if (value > 0) return 'text-up'
  if (value < 0) return 'text-down'
  return undefined
}

function HeaderStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-lg tabular-nums ${tone ?? ''}`}>{value as ReactNode}</p>
    </div>
  )
}
