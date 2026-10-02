import { EMPTY_VALUE } from '@/utils/format'

const levels = ['Price', 'Amount', 'Total']

export function OrderBook() {
  return (
    <section className="rounded-lg border border-line bg-panel" aria-label="Order book">
      <header className="border-b border-line px-3 py-2">
        <h2 className="text-sm font-medium">Order book</h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          CoinGecko does not supply an order book on this connection. No bids or asks are invented. Platform orders stay separate from any real market depth.
        </p>
      </header>
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-muted">
        {levels.map((level) => (
          <span key={level}>{level}</span>
        ))}
      </div>
      <p className="px-3 pb-2 text-xs text-down">Asks · no rows</p>
      <p className="border-y border-line px-3 py-2 text-center text-xs text-muted">Spread {EMPTY_VALUE}</p>
      <p className="px-3 py-2 text-xs text-up">Bids · no rows</p>
    </section>
  )
}
