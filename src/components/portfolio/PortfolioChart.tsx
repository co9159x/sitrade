import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/utils/format'

export function PortfolioChart({
  kind,
  slices = [],
  currency = 'USD',
  points = [],
  seriesStatus = 'idle',
  assetSeries = [],
}: {
  kind: 'allocation' | 'performance'
  slices?: { label: string; value: number }[]
  currency?: string
  points?: { time: number; value: number }[]
  seriesStatus?: 'idle' | 'loading' | 'ready' | 'error'
  assetSeries?: { symbol: string; points: { time: number; value: number }[] }[]
}) {
  const [selected, setSelected] = useState('all')
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const showBars = kind === 'allocation' && total > 0
  const activePoints = selected === 'all' ? points : assetSeries.find((item) => item.symbol === selected)?.points ?? []

  return (
    <section className="rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium">{kind === 'allocation' ? 'Allocation' : 'Performance'}</h2>
        {kind === 'performance' && assetSeries.length > 0 ? (
          <label className="text-xs text-muted">
            <span className="sr-only">Performance series</span>
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="h-8 rounded-md border border-line bg-bg px-2 text-xs text-text"
            >
              <option value="all">All holdings</option>
              {assetSeries.map((item) => (
                <option key={item.symbol} value={item.symbol}>{item.symbol}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {showBars ? (
        <ul className="space-y-3 px-4 py-4">
          {slices
            .filter((slice) => slice.value > 0)
            .sort((left, right) => right.value - left.value)
            .map((slice) => (
              <li key={slice.label}>
                <div className="flex justify-between text-xs text-muted">
                  <span>{slice.label}</span>
                  <span className="font-mono text-text">{formatMoney(slice.value, currency)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-bg">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${(slice.value / total) * 100}%` }} />
                </div>
              </li>
            ))}
        </ul>
      ) : kind === 'performance' && seriesStatus === 'loading' ? (
        <p className="px-4 py-8 text-sm text-muted">Loading 30-day reference prices.</p>
      ) : kind === 'performance' && activePoints.length > 1 ? (
        <PerformanceLine points={activePoints} currency={currency} />
      ) : (
        <EmptyState
          title="No chart yet"
          body={
            kind === 'allocation'
              ? 'Allocation uses simulated quantities and CoinGecko prices. It stays empty until both exist.'
              : seriesStatus === 'error'
                ? 'The performance series could not be loaded. No sample curve is shown.'
                : 'Performance uses current simulated quantities and CoinGecko history. It stays empty until both exist.'
          }
        />
      )}
    </section>
  )
}

function PerformanceLine({ points, currency }: { points: { time: number; value: number }[]; currency: string }) {
  const width = 640
  const height = 180
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (index: number) => 8 + (index / (points.length - 1)) * (width - 16)
  const y = (value: number) => 16 + (1 - (value - min) / span) * (height - 32)
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`).join(' ')
  const last = points[points.length - 1]
  const first = points[0]

  return (
    <div className="px-4 py-4">
      <p className="font-mono text-sm">{last ? formatMoney(last.value, currency) : ''}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-40 w-full" role="img" aria-label="Holding value over 30 days">
        <path d={path} fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" />
      </svg>
      <p className="text-xs text-muted">
        Current quantities at CoinGecko prices from {new Date(first.time).toLocaleDateString('en-GB')} to {new Date(last.time).toLocaleDateString('en-GB')}. This is not a stored equity curve.
      </p>
    </div>
  )
}
