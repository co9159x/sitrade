import { useEffect, useRef } from 'react'
import { ColorType, createChart, type UTCTimestamp } from 'lightweight-charts'
import type { HistoricalPrice } from '@/services/marketData/types'
import { formatMoney } from '@/utils/format'

export function HistoryChart({ points, currency }: { points: HistoricalPrice[]; currency: string }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = host.current
    if (!node || points.length === 0) return
    const view = createChart(node, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#93a0b5' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)' },
      localization: { priceFormatter: (price: number) => formatMoney(price, currency) },
    })
    const series = view.addAreaSeries({
      lineColor: '#7c6cff',
      topColor: 'rgba(124,108,255,0.28)',
      bottomColor: 'rgba(124,108,255,0.02)',
      priceLineVisible: true,
      lastValueVisible: true,
    })
    const byTime = new Map<number, number>()
    for (const point of points) byTime.set(Math.floor(point.time / 1000), point.price)
    series.setData([...byTime.entries()].sort((left, right) => left[0] - right[0]).map(([time, value]) => ({ time: time as UTCTimestamp, value })))
    view.timeScale().fitContent()
    return () => view.remove()
  }, [currency, points])

  return <div ref={host} className="h-64 w-full" />
}
