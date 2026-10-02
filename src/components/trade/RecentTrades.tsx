import { EmptyState } from '@/components/ui/EmptyState'

export function RecentTrades() {
  return (
    <section aria-label="Recent trades">
      <EmptyState
        title="No trades to show"
        body="CoinGecko does not supply a public trade tape on this connection. Simulated platform trades stay on the Trade history tab."
      />
    </section>
  )
}
