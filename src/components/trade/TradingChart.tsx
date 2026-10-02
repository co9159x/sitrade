import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import type { Timeframe } from '@/services/marketData/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCandles } from '@/hooks/useMarketPrices'
import { formatMoney } from '@/utils/format'

const timeframes: Timeframe[] = ['1m', '5m', '15m', '1H', '4H', '1D']

export function TradingChart({ providerAssetId, symbol }: { providerAssetId: string | null; symbol: string | null }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles')
  const [span, setSpan] = useState(120)
  const [fullscreenNote, setFullscreenNote] = useState<string | null>(null)
  const chart = useCandles(providerAssetId, timeframe)
  const visible = chart.candles.slice(-span)

  async function toggleFullscreen() {
    const node = document.getElementById('trading-chart')
    if (!node) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await node.requestFullscreen()
      setFullscreenNote(null)
    } catch {
      setFullscreenNote('Fullscreen is unavailable in this browser.')
    }
  }

  return (
    <section id="trading-chart" className="flex min-h-72 flex-col border border-line bg-panel sm:min-h-[420px]">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <div className="flex gap-1" role="group" aria-label="Timeframe">
          {timeframes.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === timeframe}
              className={`h-8 rounded-md px-2 text-xs ${item === timeframe ? 'bg-panel-raised text-text' : 'text-muted'}`}
              onClick={() => setTimeframe(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant={chartType === 'candles' ? 'secondary' : 'ghost'} onClick={() => setChartType('candles')}>
            Candles
          </Button>
          <Button size="sm" variant={chartType === 'line' ? 'secondary' : 'ghost'} onClick={() => setChartType('line')}>
            Line
          </Button>
          <Button size="sm" variant="ghost" disabled={visible.length < 20} onClick={() => setSpan((value) => Math.max(20, Math.floor(value / 2)))}>
            Zoom
          </Button>
          <Button size="sm" variant="ghost" aria-label="Fullscreen chart" onClick={() => void toggleFullscreen()}>
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-3 py-4">
        {!providerAssetId ? (
          <EmptyState title="No asset selected" body="Choose a pair to load CoinGecko history. Candles are not invented." />
        ) : chart.phase === 'loading' && chart.candles.length === 0 ? (
          <EmptyState title={`Loading ${symbol ?? 'asset'} · ${timeframe}`} body="Requesting historical prices from CoinGecko." />
        ) : chart.phase === 'error' ? (
          <EmptyState title={`${symbol ?? 'Asset'} · ${timeframe}`} body={chart.message} />
        ) : (
          <PriceChart candles={visible} mode={chartType} label={`${symbol ?? 'Asset'} ${timeframe} reference chart`} />
        )}
      </div>
      <p className="px-4 pb-3 text-xs text-muted">
        {timeframe === '1m'
          ? '1-minute candles are not available from this CoinGecko connection.'
          : 'Candles are aggregated from CoinGecko prices. Interval volume is not supplied, so volume bars are omitted.'}
        {fullscreenNote ? ` ${fullscreenNote}` : ''}
      </p>
    </section>
  )
}

function PriceChart({
  candles,
  mode,
  label,
}: {
  candles: { time: number; open: number; high: number; low: number; close: number }[]
  mode: 'candles' | 'line'
  label: string
}) {
  if (candles.length === 0) return <EmptyState title="No candles" body="The provider returned an empty range." />
  const width = 720
  const height = 280
  const low = Math.min(...candles.map((candle) => candle.low))
  const high = Math.max(...candles.map((candle) => candle.high))
  const span = high - low || 1
  const y = (price: number) => 12 + ((high - price) / span) * (height - 24)
  const slot = width / candles.length

  const line = candles.map((candle, index) => `${index === 0 ? 'M' : 'L'} ${index * slot + slot / 2} ${y(candle.close)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full" role="img" aria-label={label}>
      <title>{label}</title>
      {mode === 'line' ? (
        <path d={line} fill="none" stroke="#d5cfff" strokeWidth="2" />
      ) : (
        candles.map((candle, index) => {
          const up = candle.close >= candle.open
          const x = index * slot + slot / 2
          const color = up ? '#2fce8f' : '#ff5c6a'
          return (
            <g key={candle.time}>
              <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={color} strokeWidth="1" />
              <rect
                x={x - Math.max(1, slot * 0.3)}
                y={y(Math.max(candle.open, candle.close))}
                width={Math.max(2, slot * 0.6)}
                height={Math.max(1, Math.abs(y(candle.open) - y(candle.close)))}
                fill={color}
              />
            </g>
          )
        })
      )}
      <text x="8" y="16" fill="#93a0b5" fontSize="11">
        {formatMoney(high)}
      </text>
      <text x="8" y={height - 6} fill="#93a0b5" fontSize="11">
        {formatMoney(low)}
      </text>
    </svg>
  )
}
