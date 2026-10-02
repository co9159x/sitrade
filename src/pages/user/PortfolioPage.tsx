import { holdingRows } from '@/components/desk/rows'
import { PortfolioChart } from '@/components/portfolio/PortfolioChart'
import { AssetTable } from '@/components/tables/AssetTable'
import { AppPage } from '@/components/ui/AppPage'
import { Notice } from '@/components/ui/Notice'
import { StatCard } from '@/components/ui/StatCard'
import { useHoldingPerformance } from '@/hooks/useHoldingPerformance'
import { deskEmpty, useDesk } from '@/hooks/useDesk'
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency'
import { pricesBySymbol, useMarketPrices } from '@/hooks/useMarketPrices'
import { summarizePortfolio } from '@/lib/portfolio'
import { EMPTY_VALUE, formatMoney, formatPercent } from '@/utils/format'

function signedMoney(value: number | null, currency: string) {
  if (value === null) return EMPTY_VALUE
  return value > 0 ? `+${formatMoney(value, currency)}` : formatMoney(value, currency)
}

export function PortfolioPage() {
  const desk = useDesk()
  const { currency } = useDisplayCurrency()
  const market = useMarketPrices(desk.assets.map((asset) => asset.providerAssetId))
  const priced = pricesBySymbol(desk.assets, market.byId)
  const ready = desk.status === 'ready'
  const summary = summarizePortfolio(
    ready ? desk.balances : [],
    ready ? desk.trades : [],
    priced,
  )
  const holdings = desk.balances.flatMap((row) => {
    const asset = desk.assets.find((item) => item.symbol === row.symbol)
    const quantity = row.available + row.locked
    if (!asset?.providerAssetId || quantity <= 0) return []
    return [{ symbol: row.symbol, providerAssetId: asset.providerAssetId, quantity }]
  })
  const performance = useHoldingPerformance(ready ? holdings : [])
  const slices = holdings.flatMap((holding) => {
    const price = priced.get(holding.symbol)
    if (!price) return []
    return [{ label: holding.symbol, value: holding.quantity * price.price }]
  })
  const stats = [
    ['Total value', summary.totalValue === null ? 'Mark-to-market value needs reference prices.' : `${currency} value of priced holdings. Unpriced amounts are excluded.`, summary.totalValue === null ? EMPTY_VALUE : formatMoney(summary.totalValue, currency)],
    ['Available cash', 'USDT available, marked in the display currency. Other assets are not added in.', signedMoney(summary.availableCash, currency).replace(/^\+/, '')],
    ['Invested value', 'Cost of open trades, including buy fees. Deposits without a trade are excluded.', summary.invested === null ? EMPTY_VALUE : formatMoney(summary.invested, currency)],
    ['Unrealised P/L', 'Open trade cost compared with the current reference price.', signedMoney(summary.unrealised, currency)],
    ['Realised P/L', 'Closed simulated trades, after fees.', signedMoney(summary.realised, currency)],
    ['Trading volume', 'Quote notional of loaded fills, marked in the display currency.', summary.volume === null ? EMPTY_VALUE : formatMoney(summary.volume, currency)],
  ] as const

  return (
    <AppPage
      title="Portfolio"
      description="Ownership stays simulated. Current values use CoinGecko prices. Entry price and P/L come from stored trades."
      notice={
        <>
          <Notice title="SIMULATED PORTFOLIO">
            These figures have no monetary value. Average price and P/L stay blank when a holding has no trade cost.
          </Notice>
          {summary.uncosted ? (
            <Notice tone="info" title="Uncosted quantity">
              Some wallet quantity was not opened by a loaded trade. That quantity is in the value total and left out of average price and P/L.
            </Notice>
          ) : null}
          {desk.status === 'error' && desk.error ? <Notice title="Records unavailable">{desk.error}</Notice> : null}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, hint, value]) => (
          <StatCard key={label} label={label} value={value} hint={hint} />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <PortfolioChart kind="allocation" slices={slices} currency={currency} />
        <PortfolioChart
          kind="performance"
          currency={currency}
          points={performance.points}
          seriesStatus={performance.status}
          assetSeries={holdings.map((holding) => ({
            symbol: holding.symbol,
            points: performance.bySymbol.get(holding.symbol) ?? [],
          }))}
        />
      </div>
      <AssetTable
        rows={holdingRows(desk.balances, priced, summary.marks, currency)}
        loading={desk.status === 'loading'}
        emptyBody={deskEmpty(desk.status, 'Holdings are derived from the simulated wallet. Balances are not hardcoded.')}
      />
      {summary.dayChangePercent !== null ? (
        <p className="text-xs text-muted">24h move of current quantities: {formatPercent(summary.dayChangePercent)}. This follows reference prices, not a stored day-open balance.</p>
      ) : null}
    </AppPage>
  )
}
