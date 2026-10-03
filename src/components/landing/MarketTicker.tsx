import { EMPTY_VALUE, formatMoney, formatPercent } from '@/utils/format'

export type TapeQuote = {
  price: number
  currency: string
  change24hPercent: number | null
}

function Tick({ symbol, price, hidden }: { symbol: string; price: TapeQuote | undefined; hidden?: boolean }) {
  const change = price?.change24hPercent
  const tone = change === null || change === undefined ? 'text-white/45' : change > 0 ? 'text-up' : change < 0 ? 'text-down' : 'text-white/45'
  return (
    <div className="flex shrink-0 items-baseline gap-2.5 px-4" aria-hidden={hidden || undefined}>
      <span className="text-[11px] tracking-[0.14em] text-white/70">{symbol}</span>
      <span className="font-mono text-[13px] text-white">{price ? formatMoney(price.price, price.currency) : EMPTY_VALUE}</span>
      <span className={`font-mono text-[11px] ${tone}`}>{change === null || change === undefined ? EMPTY_VALUE : formatPercent(change)}</span>
    </div>
  )
}

export function MarketTicker({ rows }: { rows: { symbol: string; price: TapeQuote | undefined }[] }) {
  if (rows.length === 0) return null
  return (
    <div className="glass-primary overflow-hidden rounded-none border-x-0 motion-reduce:overflow-x-auto" aria-label="Live reference prices">
      <div className="ticker-track flex w-max py-2.5 hover:[animation-play-state:paused]">
        {rows.map((row) => (
          <Tick key={row.symbol} symbol={row.symbol} price={row.price} />
        ))}
        {rows.map((row) => (
          <Tick key={`${row.symbol}-copy`} symbol={row.symbol} price={row.price} hidden />
        ))}
      </div>
    </div>
  )
}
