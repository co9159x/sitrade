import { Link } from 'react-router-dom'
import { GlassCard } from '@/components/ui/Glass'
import { useCandles } from '@/hooks/useMarketPrices'
import type { MarketPrice } from '@/services/marketData/types'
import { EMPTY_VALUE, formatMoney, formatPercent } from '@/utils/format'

function sparkPath(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const width = 112
  const height = 36
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / span) * (height - 2) - 1
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function PriceSpark({ providerAssetId }: { providerAssetId: string }) {
  const chart = useCandles(providerAssetId, '1D')
  const closes = chart.candles.map((candle) => candle.close)
  if (chart.phase !== 'ready' || closes.length < 2) return <div className="h-9 w-28" />
  const rising = closes[closes.length - 1] >= closes[0]
  return (
    <svg viewBox="0 0 112 36" className="h-9 w-28" aria-hidden="true">
      <path d={sparkPath(closes)} fill="none" stroke={rising ? '#2fce8f' : '#ff5c6a'} strokeWidth="1.6" />
    </svg>
  )
}

export function MarketCard({
  symbol,
  name,
  providerAssetId,
  price,
  chart,
}: {
  symbol: string
  name: string
  providerAssetId: string
  price: MarketPrice | undefined
  chart: boolean
}) {
  const change = price?.change24hPercent
  const tone = change === null || change === undefined ? 'text-muted' : change > 0 ? 'text-up' : change < 0 ? 'text-down' : 'text-muted'

  return (
    <GlassCard className="h-full p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-[10px] text-accent-soft">
            {symbol.slice(0, 3)}
          </span>
          <div>
            <p className="font-mono text-sm">{symbol}</p>
            <p className="text-xs text-muted">{name}</p>
          </div>
        </div>
        {chart ? <PriceSpark providerAssetId={providerAssetId} /> : null}
      </div>
      <p className="mt-4 font-mono text-lg">{price ? formatMoney(price.price, price.currency) : EMPTY_VALUE}</p>
      <p className={`mt-1 font-mono text-xs ${tone}`}>{change === null || change === undefined ? EMPTY_VALUE : formatPercent(change)}</p>
      <Link to={`/markets/${encodeURIComponent(providerAssetId)}`} className="mt-3 inline-flex text-xs text-muted hover:text-text">
        Open {symbol}
      </Link>
    </GlassCard>
  )
}
