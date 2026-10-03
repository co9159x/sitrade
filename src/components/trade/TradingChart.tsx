import { useEffect, useRef, useState } from 'react'
import { ColorType, CrosshairMode, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'
import { Maximize2 } from 'lucide-react'
import type { Timeframe } from '@/services/marketData/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCandles } from '@/hooks/useMarketPrices'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { cn } from '@/utils/cn'
import { formatMoney } from '@/utils/format'

const timeframes: Timeframe[] = ['5m', '15m', '1H', '4H', '1D', '1W']

export function TradingChart({
  providerAssetId,
  symbol,
  className,
  frameClassName,
  domId = 'trading-chart',
}: {
  providerAssetId: string | null
  symbol: string | null
  className?: string
  frameClassName?: string
  domId?: string
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1H')
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles')
  const [fullscreenNote, setFullscreenNote] = useState<string | null>(null)
  const chart = useCandles(providerAssetId, timeframe)
  const { currency } = useDisplayCurrency()
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<IChartApi | null>(null)

  useEffect(() => {
    const node = host.current
    if (!node || chart.candles.length === 0) return
    const view = createChart(node, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#93a0b5',
        fontFamily: 'Outfit, Segoe UI, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: timeframe !== '1D' && timeframe !== '1W' },
      localization: { priceFormatter: (price: number) => formatMoney(price, currency) },
    })
    const rows = dedupe(chart.candles)
    let series: ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>
    if (chartType === 'line') {
      series = view.addLineSeries({ color: '#d5cfff', lineWidth: 2, priceLineVisible: true, lastValueVisible: true })
      series.setData(rows.map((candle) => ({ time: stamp(candle.time), value: candle.close })))
    } else {
      series = view.addCandlestickSeries({
        upColor: '#2fce8f',
        downColor: '#ff5c6a',
        borderUpColor: '#2fce8f',
        borderDownColor: '#ff5c6a',
        wickUpColor: '#2fce8f',
        wickDownColor: '#ff5c6a',
        priceLineVisible: true,
        lastValueVisible: true,
      })
      series.setData(rows.map((candle) => ({
        time: stamp(candle.time),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })))
    }
    view.timeScale().fitContent()
    api.current = view
    return () => {
      api.current = null
      view.remove()
    }
  }, [chart.candles, chartType, currency, timeframe])

  async function toggleFullscreen() {
    const node = document.getElementById(domId)
    if (!node) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await node.requestFullscreen()
      setFullscreenNote(null)
    } catch {
      setFullscreenNote('Fullscreen is unavailable in this browser.')
    }
  }

  function resetZoom() {
    api.current?.timeScale().fitContent()
    api.current?.priceScale('right').applyOptions({ autoScale: true })
  }

  return (
    <section id={domId} className={cn('surface-solid flex min-h-72 flex-col sm:min-h-[420px]', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Timeframe">
          {timeframes.map((item) => (
            <Button key={item} size="compact" variant={item === timeframe ? 'secondary' : 'ghost'} aria-pressed={item === timeframe} onClick={() => setTimeframe(item)}>
              {item}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          <Button size="compact" variant={chartType === 'candles' ? 'secondary' : 'ghost'} onClick={() => setChartType('candles')}>Candles</Button>
          <Button size="compact" variant={chartType === 'line' ? 'secondary' : 'ghost'} onClick={() => setChartType('line')}>Line</Button>
          <Button size="compact" variant="ghost" disabled={chart.candles.length === 0} onClick={resetZoom}>Reset</Button>
          <Button size="icon" variant="ghost" aria-label="Fullscreen chart" onClick={() => void toggleFullscreen()}>
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className={cn('relative min-h-72 flex-1', frameClassName)}>
        {!providerAssetId ? (
          <EmptyState title="No asset selected" body="Choose a pair to load CoinGecko history. Candles are not invented." />
        ) : chart.phase === 'loading' && chart.candles.length === 0 ? (
          <EmptyState title={`Loading ${symbol ?? 'asset'} · ${timeframe}`} body="Requesting historical prices from CoinGecko." />
        ) : chart.phase === 'error' ? (
          <EmptyState title={`${symbol ?? 'Asset'} · ${timeframe}`} body={chart.message} />
        ) : chart.candles.length === 0 ? (
          <EmptyState title="No candles" body="The provider returned an empty range." />
        ) : (
          <div ref={host} className="absolute inset-0" />
        )}
      </div>
      <p className="px-3 py-2 text-xs text-muted">
        Candles are built from CoinGecko prices. 1-minute candles and interval volume are not on this connection, so those are omitted rather than filled in.
        {fullscreenNote ? ` ${fullscreenNote}` : ''}
      </p>
    </section>
  )
}

function stamp(time: number): UTCTimestamp {
  return Math.floor(time / 1000) as UTCTimestamp
}

function dedupe(candles: { time: number; open: number; high: number; low: number; close: number }[]) {
  const byTime = new Map<number, (typeof candles)[number]>()
  for (const candle of candles) byTime.set(candle.time, candle)
  return [...byTime.values()].sort((left, right) => left.time - right.time)
}
